package com.managestudents.credential.repository;

import com.managestudents.common.jpa.LikePatterns;
import com.managestudents.credential.entity.Credential;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class CredentialSpecifications {

    private CredentialSpecifications() {
    }

    public static Specification<Credential> filter(UUID userId, String keyword, String category) {
        return (root, query, cb) -> {
            List<Predicate> ands = new ArrayList<>();
            if (userId != null) {
                ands.add(cb.equal(root.get("user").get("id"), userId));
            }
            if (category != null && !category.isBlank()) {
                ands.add(cb.equal(root.get("credentialCategory"), category.trim()));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = LikePatterns.contains(keyword);
                List<Predicate> ors = new ArrayList<>();
                ors.add(cb.like(root.get("credentialName"), pattern, '\\'));
                ors.add(cb.like(root.get("credentialCategory"), pattern, '\\'));
                ors.add(cb.and(
                        cb.isNotNull(root.get("issuingOrganization")),
                        cb.like(root.get("issuingOrganization"), pattern, '\\')
                ));
                ors.add(cb.and(
                        cb.isNotNull(root.get("credentialNumber")),
                        cb.like(root.get("credentialNumber"), pattern, '\\')
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
