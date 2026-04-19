package com.managestudents.common.jpa;

public final class LikePatterns {

    private LikePatterns() {
    }

    public static String contains(String keyword) {
        return "%" + escapeLike(keyword.trim()) + "%";
    }

    public static String escapeLike(String raw) {
        return raw
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}
