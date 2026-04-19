package com.managestudents.user.repository;

import com.managestudents.user.entity.User;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class UserSpecifications {

    private UserSpecifications() {
    }

    public static Specification<User> notDeleted() {
        return (root, query, cb) -> cb.isFalse(root.get("isDeleted"));
    }

    /** Tìm theo username, email, họ tên, SĐT, CCCD (gần đúng). */
    public static Specification<User> matchesKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return (root, query, cb) -> cb.conjunction();
        }
        return (root, query, cb) -> {
            String pattern = "%" + escapeLike(keyword.trim()) + "%";
            List<Predicate> ors = new ArrayList<>();
            ors.add(cb.like(root.get("username"), pattern, '\\'));
            ors.add(cb.like(root.get("email"), pattern, '\\'));
            ors.add(cb.like(root.get("fullName"), pattern, '\\'));
            ors.add(cb.and(
                    cb.isNotNull(root.get("phoneNumber")),
                    cb.like(root.get("phoneNumber"), pattern, '\\')
            ));
            ors.add(cb.and(
                    cb.isNotNull(root.get("cccd")),
                    cb.like(root.get("cccd"), pattern, '\\')
            ));
            return cb.or(ors.toArray(new Predicate[0]));
        };
    }

    private static String escapeLike(String raw) {
        return raw
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}
