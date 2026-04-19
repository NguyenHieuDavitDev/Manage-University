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
public class AvatarStorageService {

    public static final String AVATAR_PUBLIC_PREFIX = "/api/v1/files/avatars/";

    private static final long MAX_BYTES = 2 * 1024 * 1024;
    private static final Set<String> ALLOWED_EXT = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final Set<String> ALLOWED_CONTENT = Set.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp"
    );

    private static final Pattern STORED_NAME = Pattern.compile(
            "^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\\.(jpg|jpeg|png|gif|webp)$",
            Pattern.CASE_INSENSITIVE);

    private final Path avatarsRoot;

    public AvatarStorageService(StorageProperties properties) {
        String sub = properties.getAvatarsSubdir() == null ? "data/uploads/avatars" : properties.getAvatarsSubdir();
        this.avatarsRoot = Path.of(sub).toAbsolutePath().normalize();
    }

    public Path getAvatarsRoot() {
        return avatarsRoot;
    }

    public String storeAvatar(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Chưa chọn file ảnh");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("Ảnh đại diện tối đa 2MB");
        }
        String ext = extensionOf(file.getOriginalFilename());
        if (ext == null || !ALLOWED_EXT.contains(ext)) {
            throw new IllegalArgumentException("Chỉ chấp nhận ảnh: jpg, jpeg, png, gif, webp");
        }
        String ct = file.getContentType();
        if (ct != null && !ct.isBlank()) {
            String base = ct.toLowerCase(Locale.ROOT).split(";")[0].trim();
            if (!ALLOWED_CONTENT.contains(base)) {
                throw new IllegalArgumentException("Loại file không hợp lệ");
            }
        }
        Files.createDirectories(avatarsRoot);
        String name = UUID.randomUUID().toString().toLowerCase(Locale.ROOT) + "." + ext;
        Path target = avatarsRoot.resolve(name).normalize();
        if (!target.startsWith(avatarsRoot)) {
            throw new IOException("Đường dẫn không hợp lệ");
        }
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        String url = AVATAR_PUBLIC_PREFIX + name;
        if (url.length() > 255) {
            Files.deleteIfExists(target);
            throw new IllegalArgumentException("URL ảnh vượt quá 255 ký tự");
        }
        return url;
    }

    public Resource loadAsResource(String storedFileName) throws IOException {
        if (storedFileName == null || !STORED_NAME.matcher(storedFileName).matches()) {
            throw new IllegalArgumentException("Tên file không hợp lệ");
        }
        Path file = avatarsRoot.resolve(storedFileName).normalize();
        if (!file.startsWith(avatarsRoot) || !Files.isRegularFile(file)) {
            throw new java.io.FileNotFoundException("Không tìm thấy ảnh");
        }
        return new FileSystemResource(file);
    }

    public void deleteIfManaged(String avatarUrl) {
        if (avatarUrl == null || avatarUrl.isBlank()) {
            return;
        }
        String name = extractStoredFileName(avatarUrl);
        if (name == null || !STORED_NAME.matcher(name).matches()) {
            return;
        }
        Path file = avatarsRoot.resolve(name).normalize();
        if (!file.startsWith(avatarsRoot)) {
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

    public static String extractStoredFileName(String avatarUrl) {
        if (avatarUrl == null) {
            return null;
        }
        String u = avatarUrl.trim();
        if (!u.contains(AVATAR_PUBLIC_PREFIX)) {
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
