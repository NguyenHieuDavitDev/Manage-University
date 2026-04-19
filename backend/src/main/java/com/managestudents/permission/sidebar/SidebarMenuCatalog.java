package com.managestudents.permission.sidebar;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Danh mục mục sidebar cổng quản trị — đồng bộ với mã {@code permissionCode} trên frontend
 * ({@code adminSidebarNav.ts}).
 */
public final class SidebarMenuCatalog {

    public record MenuItem(String permissionCode, String label) {}

    public record MenuGroup(String groupId, String groupLabel, List<MenuItem> items) {}

    private static final List<MenuGroup> GROUPS = List.of(
            new MenuGroup(
                    "admin-users-auth",
                    "Quản trị – Người dùng & phân quyền",
                    List.of(
                            new MenuItem("admin:users", "Quản lý người dùng"),
                            new MenuItem("admin:duty_assignments", "Phân công nhiệm vụ"),
                            new MenuItem("admin:roles", "Quản lý vai trò"),
                            new MenuItem("admin:permissions", "Quản lý quyền"))),
            new MenuGroup(
                    "admin-org",
                    "Đơn vị & danh mục",
                    List.of(
                            new MenuItem("admin:academic_ranks", "Học hàm / học vị"),
                            new MenuItem("admin:faculties", "Khoa / đơn vị"),
                            new MenuItem("admin:courses", "Học phần"),
                            new MenuItem("admin:course_classes", "Lớp học phần"),
                            new MenuItem("admin:departments", "Phòng ban"),
                            new MenuItem("admin:positions", "Chức vụ"))),
            new MenuGroup(
                    "admin-hr",
                    "Hồ sơ nhân sự",
                    List.of(
                            new MenuItem("admin:credentials", "Chứng chỉ"),
                            new MenuItem("admin:insurances", "Bảo hiểm"),
                            new MenuItem("admin:labor_contracts", "Hợp đồng lao động"),
                            new MenuItem("admin:research_works", "Công trình nghiên cứu"))));

    private static final Map<String, String> CODE_TO_LABEL;

    static {
        Map<String, String> m = new LinkedHashMap<>();
        for (MenuGroup g : GROUPS) {
            for (MenuItem it : g.items()) {
                m.put(it.permissionCode(), it.label());
            }
        }
        CODE_TO_LABEL = Map.copyOf(m);
    }

    private SidebarMenuCatalog() {
    }

    public static List<MenuGroup> groups() {
        return GROUPS;
    }

    public static Set<String> allCodes() {
        return CODE_TO_LABEL.keySet();
    }

    public static String labelForCode(String permissionCode) {
        return CODE_TO_LABEL.getOrDefault(permissionCode, permissionCode);
    }

    public static List<String> sortedCodes() {
        List<String> list = new ArrayList<>(allCodes());
        list.sort(String.CASE_INSENSITIVE_ORDER);
        return list;
    }

    public static boolean isCatalogCode(String code) {
        return code != null && CODE_TO_LABEL.containsKey(code.trim());
    }

    public static String normalizeCode(String raw) {
        return raw == null ? "" : raw.trim();
    }

    /** Mã không thuộc catalog (để báo lỗi tập trung). */
    public static List<String> invalidCodes(Iterable<String> requested) {
        List<String> bad = new ArrayList<>();
        if (requested == null) {
            return bad;
        }
        Set<String> catalog = allCodes();
        for (String raw : requested) {
            String c = normalizeCode(raw);
            if (c.isEmpty()) {
                continue;
            }
            if (!catalog.contains(c)) {
                bad.add(c);
            }
        }
        return bad.stream().distinct().collect(Collectors.toList());
    }
}
