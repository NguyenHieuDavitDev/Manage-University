package com.managestudents.chat;

import com.managestudents.chat.dto.ChatMessageResponse;
import com.managestudents.chat.dto.ChatSendMessageResponse;
import com.managestudents.chat.dto.ChatSessionResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatService {

    private final GeminiChatClient geminiChatClient;
    private final Map<UUID, Map<UUID, SessionState>> sessionsByUser = new ConcurrentHashMap<>();

    public ChatService(GeminiChatClient geminiChatClient) {
        this.geminiChatClient = geminiChatClient;
    }

    public ChatSessionResponse createSession(UUID userId, String title) {
        Instant now = Instant.now();
        String normalizedTitle = normalizeTitle(title);
        SessionState session = new SessionState(UUID.randomUUID(), normalizedTitle, now, now);
        sessionsByUser.computeIfAbsent(userId, k -> new ConcurrentHashMap<>()).put(session.sessionId(), session);
        return toSessionResponse(session);
    }

    public List<ChatSessionResponse> listSessions(UUID userId) {
        Map<UUID, SessionState> userSessions = sessionsByUser.getOrDefault(userId, Map.of());
        return userSessions.values().stream()
                .sorted(Comparator.comparing(SessionState::updatedAt).reversed())
                .map(this::toSessionResponse)
                .toList();
    }

    public List<ChatMessageResponse> listMessages(UUID userId, UUID sessionId) {
        SessionState session = requiredSession(userId, sessionId);
        return session.messages().stream().map(this::toMessageResponse).toList();
    }

    public ChatSendMessageResponse sendMessage(UUID userId, UUID sessionId, String message) {
        SessionState session = requiredSession(userId, sessionId);
        Instant now = Instant.now();
        MessageState userMessage = new MessageState(UUID.randomUUID(), "user", message.trim(), now);
        session.messages().add(userMessage);

        // Truyền toàn bộ lịch sử hội thoại trước đó vào Gemini (multi-turn)
        List<GeminiChatClient.ConversationTurn> history = session.messages().stream()
                .limit(Math.max(0, session.messages().size() - 1)) // bỏ tin nhắn user vừa thêm
                .filter(m -> m.content() != null && !m.content().isBlank())
                .map(m -> new GeminiChatClient.ConversationTurn(m.role(), m.content()))
                .toList();

        String aiReply;
        try {
            aiReply = geminiChatClient.chat(history, message.trim());
        } catch (Exception ex) {
            aiReply = fallbackReply(message.trim(), ex.getMessage());
        }
        MessageState assistantMessage = new MessageState(UUID.randomUUID(), "assistant", aiReply, Instant.now());
        session.messages().add(assistantMessage);
        session.setUpdatedAt(assistantMessage.createdAt());
        if (session.title().equals("Cuộc trò chuyện mới")) {
            session.setTitle(suggestTitle(userMessage.content()));
        }

        ChatSendMessageResponse response = new ChatSendMessageResponse();
        response.setUserMessage(toMessageResponse(userMessage));
        response.setAssistantMessage(toMessageResponse(assistantMessage));
        return response;
    }

    public void deleteSession(UUID userId, UUID sessionId) {
        Map<UUID, SessionState> userSessions = sessionsByUser.get(userId);
        if (userSessions == null || userSessions.remove(sessionId) == null) {
            throw new IllegalArgumentException("Không tìm thấy phiên trò chuyện");
        }
    }

    private SessionState requiredSession(UUID userId, UUID sessionId) {
        Map<UUID, SessionState> userSessions = sessionsByUser.get(userId);
        if (userSessions == null) {
            throw new AccessDeniedException("Bạn không có quyền truy cập phiên trò chuyện này");
        }
        SessionState session = userSessions.get(sessionId);
        if (session == null) {
            throw new AccessDeniedException("Bạn không có quyền truy cập phiên trò chuyện này");
        }
        return session;
    }

    private String normalizeTitle(String title) {
        if (title == null || title.isBlank()) {
            return "Cuộc trò chuyện mới";
        }
        String trimmed = title.trim();
        return trimmed.length() > 120 ? trimmed.substring(0, 120) : trimmed;
    }

    private String suggestTitle(String firstQuestion) {
        String cleaned = firstQuestion.replaceAll("\\s+", " ").trim();
        if (cleaned.isBlank()) {
            return "Cuộc trò chuyện mới";
        }
        return cleaned.length() > 60 ? cleaned.substring(0, 60) + "..." : cleaned;
    }

    private String fallbackReply(String question, String reason) {
        String q = question == null ? "" : question.replaceAll("\\s+", " ").trim().toLowerCase();

        // Phát hiện chủ đề và trả lời theo nội dung câu hỏi
        if (containsAny(q, "backend", "lập trình phía server", "spring", "node", "api", "server")) {
            return """
                    **Lộ trình học Backend Development**

                    **Giai đoạn 1 – Nền tảng (1-2 tháng)**
                    - Học một ngôn ngữ: Java, Python, hoặc Node.js (chọn 1)
                    - Hiểu HTTP, REST API, JSON
                    - Làm quen với Git và dòng lệnh

                    **Giai đoạn 2 – Framework (2-3 tháng)**
                    - Java → Spring Boot | Python → Django/FastAPI | Node → Express/NestJS
                    - Kết nối database: MySQL hoặc PostgreSQL
                    - Xây CRUD API hoàn chỉnh

                    **Giai đoạn 3 – Thực chiến (2-3 tháng)**
                    - Authentication (JWT, OAuth2)
                    - Docker, triển khai lên cloud (Railway, Render)
                    - Viết unit test, tích hợp CI/CD

                    **Kỹ năng cần có:** SQL, HTTP/REST, Git, một framework backend, Docker cơ bản.

                    _(Lưu ý: Trợ lý AI đang tạm thời bận — đây là câu trả lời được chuẩn bị sẵn)_
                    """;
        }

        if (containsAny(q, "frontend", "react", "vue", "angular", "html", "css", "javascript", "typescript", "giao diện")) {
            return """
                    **Lộ trình học Frontend Development**

                    **Giai đoạn 1 – Web cơ bản (1-2 tháng)**
                    - HTML5, CSS3, JavaScript (ES6+)
                    - Responsive design, Flexbox, Grid
                    - Git cơ bản

                    **Giai đoạn 2 – Framework (2-3 tháng)**
                    - React (phổ biến nhất) hoặc Vue.js
                    - TypeScript
                    - Tailwind CSS / CSS Modules

                    **Giai đoạn 3 – Thực chiến (2-3 tháng)**
                    - Tích hợp API (fetch, Axios)
                    - State management (Redux / Zustand / Pinia)
                    - Next.js hoặc Nuxt.js (SSR/SSG)
                    - Deploy lên Vercel / Netlify

                    **Kỹ năng cần có:** JavaScript vững, CSS thành thạo, một framework chính, Git.

                    _(Lưu ý: Trợ lý AI đang tạm thời bận — đây là câu trả lời được chuẩn bị sẵn)_
                    """;
        }

        if (containsAny(q, "fullstack", "full-stack", "full stack")) {
            return """
                    **Lộ trình học Fullstack**

                    Học theo thứ tự: Frontend cơ bản → Backend → Kết nối hai đầu → Deploy.

                    **Stack gợi ý cho người mới:**
                    - Frontend: React + TypeScript + Tailwind
                    - Backend: Node.js (Express/NestJS) hoặc Spring Boot
                    - Database: PostgreSQL
                    - Deploy: Vercel (FE) + Railway/Render (BE)

                    **Thời gian:** 6-12 tháng tùy mức độ tập trung.

                    _(Lưu ý: Trợ lý AI đang tạm thời bận — đây là câu trả lời được chuẩn bị sẵn)_
                    """;
        }

        if (containsAny(q, "ngành", "chọn ngành", "học ngành", "nên học", "phù hợp", "hướng nghiệp", "nghề")) {
            return """
                    **Hướng dẫn chọn ngành học**

                    **3 yếu tố cần cân nhắc:**
                    1. **Sở thích** – Bạn thích làm gì? (thiết kế, lập trình, kinh doanh, y tế...)
                    2. **Năng lực** – Bạn học tốt môn gì? (toán, văn, hóa...)
                    3. **Thị trường** – Ngành nào đang có nhu cầu tuyển dụng cao?

                    **Các ngành hot hiện nay:**
                    - Công nghệ thông tin / Kỹ thuật phần mềm
                    - Trí tuệ nhân tạo / Khoa học dữ liệu
                    - Điều dưỡng / Y tế
                    - Kinh doanh quốc tế / Logistics
                    - Kỹ thuật điện – điện tử

                    **Gợi ý:** Hãy thử làm bài test Holland (RIASEC) để xác định nhóm nghề nghiệp phù hợp.

                    _(Lưu ý: Trợ lý AI đang tạm thời bận — đây là câu trả lời được chuẩn bị sẵn)_
                    """;
        }

        if (containsAny(q, "lập trình", "code", "coding", "phần mềm", "developer", "it", "công nghệ thông tin")) {
            return """
                    **Bắt đầu học lập trình từ đầu**

                    **Bước 1 – Chọn ngôn ngữ đầu tiên**
                    - Python: dễ học, phù hợp AI/Data
                    - JavaScript: học ngay ra web
                    - Java: nền tảng vững, phổ biến ở Việt Nam

                    **Bước 2 – Tài nguyên miễn phí**
                    - freeCodeCamp, The Odin Project (tiếng Anh)
                    - Kteam.vn, Funix.edu.vn (tiếng Việt)

                    **Bước 3 – Thực hành mỗi ngày ít nhất 1 giờ**
                    - Làm bài tập trên LeetCode (Easy), HackerRank
                    - Xây project nhỏ: todo app, calculator, blog cá nhân

                    **Thời gian để được việc:** 6-12 tháng nếu học đúng cách.

                    _(Lưu ý: Trợ lý AI đang tạm thời bận — đây là câu trả lời được chuẩn bị sẵn)_
                    """;
        }

        // Fallback chung khi không xác định được chủ đề
        return """
                Xin chào! Tôi là trợ lý AI và hiện tại đang gặp sự cố kết nối tạm thời.

                Bạn vừa hỏi: **"%s"**

                Tôi chưa thể trả lời ngay lúc này. Bạn có thể:
                - Thử gửi lại câu hỏi sau 1-2 phút
                - Diễn đạt ngắn gọn hơn (ví dụ: "lộ trình học backend", "chọn ngành IT")
                - Chia nhỏ câu hỏi thành từng phần cụ thể

                Hệ thống sẽ sớm hoạt động trở lại!
                """.formatted(question == null ? "" : question.trim());
    }

    private static boolean containsAny(String text, String... keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    private ChatSessionResponse toSessionResponse(SessionState state) {
        ChatSessionResponse dto = new ChatSessionResponse();
        dto.setSessionId(state.sessionId());
        dto.setTitle(state.title());
        dto.setCreatedAt(state.createdAt());
        dto.setUpdatedAt(state.updatedAt());
        dto.setTotalMessages(state.messages().size());
        return dto;
    }

    private ChatMessageResponse toMessageResponse(MessageState state) {
        ChatMessageResponse dto = new ChatMessageResponse();
        dto.setMessageId(state.messageId());
        dto.setRole(state.role());
        dto.setContent(state.content());
        dto.setCreatedAt(state.createdAt());
        return dto;
    }

    private static final class SessionState {
        private final UUID sessionId;
        private String title;
        private final Instant createdAt;
        private Instant updatedAt;
        private final List<MessageState> messages = new ArrayList<>();

        private SessionState(UUID sessionId, String title, Instant createdAt, Instant updatedAt) {
            this.sessionId = sessionId;
            this.title = title;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
        }

        UUID sessionId() {
            return sessionId;
        }

        String title() {
            return title;
        }

        void setTitle(String title) {
            this.title = title;
        }

        Instant createdAt() {
            return createdAt;
        }

        Instant updatedAt() {
            return updatedAt;
        }

        void setUpdatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
        }

        List<MessageState> messages() {
            return messages;
        }
    }

    private record MessageState(UUID messageId, String role, String content, Instant createdAt) {
    }
}
