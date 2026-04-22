package com.managestudents.chat;

import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Component
public class GeminiChatClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiChatClient.class);

    /** Thứ tự ưu tiên: model mới nhất trước, fallback sang các model cũ hơn */
    private static final List<String> FALLBACK_MODELS =
            List.of("gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro");

    private static final String SYSTEM_PROMPT = """
            Bạn là trợ lý AI thông minh, thân thiện, hỗ trợ sinh viên và người dùng trong hệ thống quản lý trường đại học.
            Bạn có thể trả lời MỌI câu hỏi: học thuật, kỹ thuật, cuộc sống, tư vấn nghề nghiệp, v.v.
            
            Khi được hỏi về NGÀNH HỌC hoặc HƯỚNG NGHIỆP, hãy:
            1) Gợi ý ngành phù hợp và lý do cụ thể.
            2) Kỹ năng cần chuẩn bị.
            3) Lộ trình học 6-12 tháng.
            4) Cơ hội nghề nghiệp đầu ra.
            
            Quy tắc trả lời:
            - Luôn trả lời bằng TIẾNG VIỆT, rõ ràng, thực tế.
            - Dùng danh sách (số hoặc gạch đầu dòng) khi liệt kê.
            - Nếu câu hỏi không rõ, hỏi lại ngắn gọn (tối đa 2 câu).
            - Không từ chối trả lời trừ khi câu hỏi vi phạm đạo đức/pháp luật.
            - Trả lời ngắn gọn, tập trung vào điểm cốt lõi.
            """;

    private final GeminiProperties properties;

    public GeminiChatClient(GeminiProperties properties) {
        this.properties = properties;
    }

    /**
     * Gửi tin nhắn kèm lịch sử hội thoại đến Gemini (multi-turn).
     * Tự động thử nhiều model khi gặp lỗi 404 hoặc 429 (quota/rate-limit).
     */
    public String chat(List<ConversationTurn> history, String userMessage) {
        if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            throw new IllegalArgumentException("Thiếu APP_GEMINI_API_KEY trong biến môi trường.");
        }

        Client client = Client.builder().apiKey(properties.getApiKey()).build();
        Set<String> models = candidateModels();
        String lastErr = "Không có model nào khả dụng.";

        for (String model : models) {
            // Thử model tối đa 2 lần (lần 2 sau khi sleep 2s nếu rate-limit thoáng qua)
            for (int attempt = 1; attempt <= 2; attempt++) {
                try {
                    String text = generateWithHistory(client, model, history, userMessage);
                    if (text != null && !text.isBlank()) {
                        log.debug("Gemini OK – model={} attempt={}", model, attempt);
                        return text;
                    }
                    lastErr = "Model '" + model + "' trả về nội dung rỗng.";
                    break; // nội dung rỗng → thử model tiếp theo, không retry
                } catch (Exception ex) {
                    String msg = ex.getMessage() == null ? "" : ex.getMessage();

                    if (isAuthError(msg)) {
                        // API key sai → không retry, không thử model khác
                        throw new AccessDeniedException("Gemini API key không hợp lệ hoặc thiếu quyền truy cập.");
                    }

                    if (isNotFoundError(msg)) {
                        // Model không tồn tại → thử model tiếp theo ngay
                        log.warn("Gemini model not found: {}", model);
                        lastErr = "Model '" + model + "' chưa khả dụng với API key này.";
                        break;
                    }

                    if (isQuotaExceeded(msg)) {
                        log.warn("Gemini quota exceeded for model={} attempt={}", model, attempt);
                        lastErr = "Quota model '" + model + "' đã hết.";
                        if (attempt == 1) {
                            // Chờ 2s rồi retry một lần – có thể là rate-limit thoáng qua
                            sleepQuietly(2_000);
                            continue;
                        }
                        // Lần 2 vẫn lỗi → thử model khác
                        break;
                    }

                    // Lỗi không xác định → log và thử model tiếp theo
                    log.warn("Gemini error model={} attempt={}: {}", model, attempt, msg);
                    lastErr = "Lỗi model '" + model + "': " + msg;
                    break;
                }
            }
        }

        throw new IllegalArgumentException(lastErr);
    }

    private String generateWithHistory(Client client, String model,
                                       List<ConversationTurn> history, String userMessage) {
        Content systemInstruction = Content.fromParts(Part.fromText(SYSTEM_PROMPT));

        // Chỉ giữ tối đa 10 lượt gần nhất để tránh vượt context window
        List<ConversationTurn> trimmedHistory = history.size() > 10
                ? history.subList(history.size() - 10, history.size())
                : history;

        List<Content> contents = new ArrayList<>();
        for (ConversationTurn turn : trimmedHistory) {
            contents.add(Content.fromParts(Part.fromText(turn.content())));
        }
        contents.add(Content.fromParts(Part.fromText(userMessage)));

        GenerateContentConfig config = GenerateContentConfig.builder()
                .systemInstruction(systemInstruction)
                .candidateCount(1)
                .maxOutputTokens(2048)
                .build();

        GenerateContentResponse response = client.models.generateContent(model, userMessage, config);
        String text = response.text();
        return (text == null || text.isBlank()) ? null : text.trim();
    }

    private Set<String> candidateModels() {
        Set<String> models = new LinkedHashSet<>();
        // Model được cấu hình qua env đứng đầu tiên
        if (properties.getModel() != null && !properties.getModel().isBlank()) {
            models.add(properties.getModel().trim());
        }
        models.addAll(FALLBACK_MODELS);
        return models;
    }

    private static void sleepQuietly(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }

    private boolean isNotFoundError(String message) {
        return message.contains("404") || message.contains("NOT_FOUND");
    }

    private boolean isAuthError(String message) {
        return message.contains(String.valueOf(HttpStatus.UNAUTHORIZED.value()))
                || message.contains(String.valueOf(HttpStatus.FORBIDDEN.value()))
                || message.contains("UNAUTHENTICATED")
                || message.contains("PERMISSION_DENIED");
    }

    private boolean isQuotaExceeded(String message) {
        return message.contains(String.valueOf(HttpStatus.TOO_MANY_REQUESTS.value()))
                || message.toLowerCase().contains("quota")
                || message.toLowerCase().contains("rate limit")
                || message.toLowerCase().contains("resource_exhausted");
    }

    /** Một lượt hội thoại: role = "user" | "assistant", content = nội dung */
    public record ConversationTurn(String role, String content) {}
}
