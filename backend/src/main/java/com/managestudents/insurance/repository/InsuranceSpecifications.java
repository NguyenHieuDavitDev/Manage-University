package com.managestudents.insurance.repository;

import com.managestudents.common.jpa.LikePatterns;
import com.managestudents.insurance.entity.Insurance;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class InsuranceSpecifications {

    private InsuranceSpecifications() {
    }

    public static Specification<Insurance> filter(UUID userId, String keyword, String insuranceType) {
        return (root, query, cb) -> {
            List<Predicate> ands = new ArrayList<>();
            if (userId != null) {
                ands.add(cb.equal(root.get("user").get("id"), userId));
            }
            if (insuranceType != null && !insuranceType.isBlank()) {
                ands.add(cb.equal(root.get("insuranceType"), insuranceType.trim()));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = LikePatterns.contains(keyword);
                List<Predicate> ors = new ArrayList<>();
                ors.add(cb.like(root.get("insuranceType"), pattern, '\\'));
                ors.add(cb.and(
                        cb.isNotNull(root.get("policyNumber")),
                        cb.like(root.get("policyNumber"), pattern, '\\')
                ));
                ors.add(cb.and(
                        cb.isNotNull(root.get("provider")),
                        cb.like(root.get("provider"), pattern, '\\')
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
