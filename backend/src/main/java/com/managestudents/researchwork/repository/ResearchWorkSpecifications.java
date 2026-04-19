package com.managestudents.researchwork.repository;

import com.managestudents.common.jpa.LikePatterns;
import com.managestudents.researchwork.entity.ResearchWork;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class ResearchWorkSpecifications {

    private ResearchWorkSpecifications() {
    }

    public static Specification<ResearchWork> filter(UUID userId, String keyword, String workType) {
        return (root, query, cb) -> {
            List<Predicate> ands = new ArrayList<>();
            if (userId != null) {
                ands.add(cb.equal(root.get("user").get("id"), userId));
            }
            if (workType != null && !workType.isBlank()) {
                ands.add(cb.equal(root.get("workType"), workType.trim()));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = LikePatterns.contains(keyword);
                List<Predicate> ors = new ArrayList<>();
                ors.add(cb.like(root.get("title"), pattern, '\\'));
                ors.add(cb.and(
                        cb.isNotNull(root.get("venue")),
                        cb.like(root.get("venue"), pattern, '\\')
                ));
                ors.add(cb.and(
                        cb.isNotNull(root.get("workType")),
                        cb.like(root.get("workType"), pattern, '\\')
                ));
                ors.add(cb.and(
                        cb.isNotNull(root.get("authorRole")),
                        cb.like(root.get("authorRole"), pattern, '\\')
                ));
                ors.add(cb.and(
                        cb.isNotNull(root.get("notes")),
                        cb.like(root.get("notes"), pattern, '\\')
                ));
                ors.add(cb.and(
                        cb.isNotNull(root.get("attachmentUrl")),
                        cb.like(root.get("attachmentUrl"), pattern, '\\')
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
