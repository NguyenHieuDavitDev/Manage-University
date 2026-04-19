package com.managestudents.workhistory.repository;

import com.managestudents.common.jpa.LikePatterns;
import com.managestudents.workhistory.entity.WorkHistory;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class WorkHistorySpecifications {

    private WorkHistorySpecifications() {
    }

    public static Specification<WorkHistory> filter(UUID userId, String keyword) {
        return (root, query, cb) -> {
            List<Predicate> ands = new ArrayList<>();
            if (userId != null) {
                ands.add(cb.equal(root.get("user").get("id"), userId));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = LikePatterns.contains(keyword);
                List<Predicate> ors = new ArrayList<>();
                ors.add(cb.like(root.get("organizationName"), pattern, '\\'));
                ors.add(cb.like(root.get("jobTitle"), pattern, '\\'));
                ors.add(cb.and(
                        cb.isNotNull(root.get("description")),
                        cb.like(root.get("description"), pattern, '\\')
                ));
                Join<?, ?> userJoin = root.join("user");
                ors.add(cb.like(userJoin.get("fullName"), pattern, '\\'));
                ands.add(cb.or(ors.toArray(new Predicate[0])));
            }
            if (ands.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(ands.toArray(new Predicate[0]));
        };
    }
}
