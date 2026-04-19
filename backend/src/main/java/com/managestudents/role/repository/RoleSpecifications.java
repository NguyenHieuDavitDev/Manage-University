package com.managestudents.role.repository;

import com.managestudents.role.entity.Role;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class RoleSpecifications {

    private RoleSpecifications() {
    }

    /**
     * Tìm kiếm gần đúng theo mã, tên hoặc mô tả (LIKE, hỗ trợ Unicode qua cột NVARCHAR).
     */
    public static Specification<Role> matchesKeyword(String keyword) {
        return (root, query, cb) -> {
            String pattern = "%" + escapeLike(keyword.trim()) + "%";
            List<Predicate> ors = new ArrayList<>();
            ors.add(cb.like(root.get("roleCode"), pattern, '\\'));
            ors.add(cb.like(root.get("roleName"), pattern, '\\'));
            ors.add(cb.and(
                    cb.isNotNull(root.get("description")),
                    cb.like(root.get("description"), pattern, '\\')
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
