package com.managestudents.auth;

import java.util.Collection;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

public final class PortalRouting {

    private PortalRouting() {
    }

    /** Chuẩn hóa mã vai trò: trim, IN HOA, bỏ tiền tố {@code ROLE_} (nếu có). */
    public static String normalizeRoleCode(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        String t = raw.trim().toUpperCase(Locale.ROOT);
        if (t.startsWith("ROLE_")) {
            return t.substring("ROLE_".length());
        }
        return t;
    }

    public static Set<String> normalizedRoleCodes(Collection<String> roleCodes) {
        if (roleCodes == null || roleCodes.isEmpty()) {
            return Set.of();
        }
        return roleCodes.stream()
                .map(PortalRouting::normalizeRoleCode)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    /** Trang mặc định sau đăng nhập: ADMIN → admin, USER → user, role khác → admin. */
    public static String defaultRoute(Collection<String> roleCodes) {
        Set<String> up = normalizedRoleCodes(roleCodes);
        if (up.contains("ADMIN")) {
            return "/admin";
        }
        if (up.contains("USER")) {
            return "/user";
        }
        return "/admin";
    }

    /**
     * Chỉ tài khoản <strong>duy nhất</strong> vai trò USER (không có ADMIN / role khác) thì không mở cổng quản trị.
     */
    public static boolean canAccessAdminPortal(Collection<String> roleCodes) {
        Set<String> up = normalizedRoleCodes(roleCodes);
        if (up.isEmpty()) {
            return false;
        }
        if (up.contains("ADMIN")) {
            return true;
        }
        return !(up.size() == 1 && up.contains("USER"));
    }
}
