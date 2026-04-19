package com.managestudents.laborcontract.repository;

import com.managestudents.common.jpa.LikePatterns;
import com.managestudents.laborcontract.entity.LaborContract;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class LaborContractSpecifications {

    private LaborContractSpecifications() {
    }

    public static Specification<LaborContract> filter(UUID userId, String keyword, String contractType) {
        return (root, query, cb) -> {
            List<Predicate> ands = new ArrayList<>();
            if (userId != null) {
                ands.add(cb.equal(root.get("user").get("id"), userId));
            }
            if (contractType != null && !contractType.isBlank()) {
                ands.add(cb.equal(root.get("contractType"), contractType.trim()));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = LikePatterns.contains(keyword);
                List<Predicate> ors = new ArrayList<>();
                ors.add(cb.like(root.get("contractNumber"), pattern, '\\'));
                ors.add(cb.and(
                        cb.isNotNull(root.get("contractType")),
                        cb.like(root.get("contractType"), pattern, '\\')
                ));
                ors.add(cb.and(
                        cb.isNotNull(root.get("status")),
                        cb.like(root.get("status"), pattern, '\\')
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
