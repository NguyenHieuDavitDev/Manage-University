package com.managestudents.permission.repository;

import com.managestudents.permission.entity.Permission;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class PermissionSpecifications {

    private PermissionSpecifications() {
    }

    /**
     * Tìm kiếm gần đúng theo mã, tên hoặc mô tả (LIKE, Unicode qua NVARCHAR).
     */
    public static Specification<Permission> matchesKeyword(String keyword) {
        return (root, query, cb) -> {
            String pattern = "%" + escapeLike(keyword.trim()) + "%";
            List<Predicate> ors = new ArrayList<>();
            ors.add(cb.like(root.get("permissionCode"), pattern, '\\'));
            ors.add(cb.like(root.get("permissionName"), pattern, '\\'));
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
