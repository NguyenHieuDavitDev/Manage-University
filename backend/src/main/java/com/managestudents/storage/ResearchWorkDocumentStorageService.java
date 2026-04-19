package com.managestudents.storage;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class ResearchWorkDocumentStorageService {

    public static final String RESEARCH_WORK_PUBLIC_PREFIX = "/api/v1/files/research-works/";

    private static final long MAX_BYTES = 10 * 1024 * 1024;
    private static final Set<String> ALLOWED_EXT = Set.of(
            "pdf", "jpg", "jpeg", "png", "gif", "webp", "doc", "docx");
    private static final Set<String> ALLOWED_CONTENT = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    private static final Pattern STORED_NAME = Pattern.compile(
            "^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\\.(pdf|jpe?g|png|gif|webp|docx|doc)$",
            Pattern.CASE_INSENSITIVE);

    private final Path root;

    public ResearchWorkDocumentStorageService(StorageProperties properties) {
        String sub = properties.getResearchWorksSubdir() == null
                ? "data/uploads/research-works"
                : properties.getResearchWorksSubdir();
        this.root = Path.of(sub).toAbsolutePath().normalize();
    }

    public Path getRoot() {
        return root;
    }

    public String store(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Chưa chọn file");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("File đính kèm tối đa 10MB");
        }
        String ext = extensionOf(file.getOriginalFilename());
        if (ext == null || !ALLOWED_EXT.contains(ext)) {
            throw new IllegalArgumentException("Chỉ chấp nhận: pdf, jpg, jpeg, png, gif, webp, doc, docx");
        }
        String ct = file.getContentType();
        if (ct != null && !ct.isBlank()) {
            String base = ct.toLowerCase(Locale.ROOT).split(";")[0].trim();
            if (!"application/octet-stream".equals(base) && !ALLOWED_CONTENT.contains(base)) {
                throw new IllegalArgumentException("Loại file không hợp lệ");
            }
        }
        Files.createDirectories(root);
        String name = UUID.randomUUID().toString().toLowerCase(Locale.ROOT) + "." + ext;
        Path target = root.resolve(name).normalize();
        if (!target.startsWith(root)) {
            throw new IOException("Đường dẫn không hợp lệ");
        }
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        String url = RESEARCH_WORK_PUBLIC_PREFIX + name;
        if (url.length() > 512) {
            Files.deleteIfExists(target);
            throw new IllegalArgumentException("URL file vượt quá 512 ký tự");
        }
        return url;
    }

    public Resource loadAsResource(String storedFileName) throws IOException {
        if (storedFileName == null || !STORED_NAME.matcher(storedFileName).matches()) {
            throw new IllegalArgumentException("Tên file không hợp lệ");
        }
        Path file = root.resolve(storedFileName).normalize();
        if (!file.startsWith(root) || !Files.isRegularFile(file)) {
            throw new java.io.FileNotFoundException("Không tìm thấy file");
        }
        return new FileSystemResource(file);
    }

    public void deleteIfManaged(String publicUrl) {
        if (publicUrl == null || publicUrl.isBlank()) {
            return;
        }
        String name = extractStoredFileName(publicUrl);
        if (name == null || !STORED_NAME.matcher(name).matches()) {
            return;
        }
        Path file = root.resolve(name).normalize();
        if (!file.startsWith(root)) {
            return;
        }
        try {
            Files.deleteIfExists(file);
        } catch (IOException ignored) {
            /* best effort */
        }
    }

    public void deleteIfReplaced(String previousUrl, String newUrl) {
        if (previousUrl == null || previousUrl.isBlank()) {
            return;
        }
        String prev = previousUrl.trim();
        String next = newUrl == null ? "" : newUrl.trim();
        if (prev.equals(next)) {
            return;
        }
        deleteIfManaged(prev);
    }

    public static String extractStoredFileName(String publicUrl) {
        if (publicUrl == null) {
            return null;
        }
        String u = publicUrl.trim();
        if (!u.contains(RESEARCH_WORK_PUBLIC_PREFIX)) {
            return null;
        }
        int i = u.lastIndexOf('/') + 1;
        if (i <= 0 || i >= u.length()) {
            return null;
        }
        return u.substring(i);
    }

    private static String extensionOf(String original) {
        if (original == null) {
            return null;
        }
        String n = original.trim();
        int dot = n.lastIndexOf('.');
        if (dot < 0 || dot == n.length() - 1) {
            return null;
        }
        return n.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
}
