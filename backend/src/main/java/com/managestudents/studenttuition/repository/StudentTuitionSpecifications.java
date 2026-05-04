package com.managestudents.studenttuition.repository;

import com.managestudents.common.jpa.LikePatterns;
import com.managestudents.studenttuition.entity.StudentTuition;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class StudentTuitionSpecifications {

    private StudentTuitionSpecifications() {
    }

    public static Specification<StudentTuition> filter(
            String keyword,
            UUID userId,
            String academicYear,
            Integer semester,
            String paymentStatus) {
        return (root, query, cb) -> {
            List<Predicate> ands = new ArrayList<>();

            if (userId != null) {
                ands.add(cb.equal(root.get("user").get("id"), userId));
            }
            if (academicYear != null && !academicYear.isBlank()) {
                ands.add(cb.equal(root.get("academicYear"), academicYear.trim()));
            }
            if (semester != null) {
                ands.add(cb.equal(root.get("semester"), semester));
            }
            if (paymentStatus != null && !paymentStatus.isBlank()) {
                ands.add(cb.equal(root.get("paymentStatus"), paymentStatus.trim().toUpperCase()));
            }

            if (keyword != null && !keyword.isBlank()) {
                String pattern = LikePatterns.contains(keyword);
                var userJoin = root.join("user", JoinType.LEFT);
                var rateJoin = root.join("tuitionRate", JoinType.LEFT);
                List<Predicate> ors = new ArrayList<>();
                ors.add(cb.like(root.get("academicYear"), pattern, '\\'));
                ors.add(cb.like(root.get("notes"), pattern, '\\'));
                ors.add(cb.like(root.get("paymentStatus"), pattern, '\\'));
                ors.add(cb.like(userJoin.get("fullName"), pattern, '\\'));
                ors.add(cb.like(userJoin.get("username"), pattern, '\\'));
                ors.add(cb.like(rateJoin.get("tuitionName"), pattern, '\\'));
                ors.add(cb.like(rateJoin.get("tuitionCode"), pattern, '\\'));
                ands.add(cb.or(ors.toArray(new Predicate[0])));
            }

            return ands.isEmpty() ? cb.conjunction() : cb.and(ands.toArray(new Predicate[0]));
        };
    }
}
