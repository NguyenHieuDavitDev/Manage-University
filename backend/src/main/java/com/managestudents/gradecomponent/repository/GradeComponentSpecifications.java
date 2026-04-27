package com.managestudents.gradecomponent.repository;

import com.managestudents.common.jpa.LikePatterns;
import com.managestudents.gradecomponent.entity.GradeComponent;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class GradeComponentSpecifications {

    private GradeComponentSpecifications() {
    }

    public static Specification<GradeComponent> matchesKeyword(String keyword) {
        return (root, query, cb) -> {
            String pattern = LikePatterns.contains(keyword);
            List<Predicate> ors = new ArrayList<>();
            ors.add(cb.like(root.get("componentCode"), pattern, '\\'));
            ors.add(cb.like(root.get("componentName"), pattern, '\\'));
            ors.add(cb.and(
                    cb.isNotNull(root.get("description")),
                    cb.like(root.get("description"), pattern, '\\')
            ));
            return cb.or(ors.toArray(new Predicate[0]));
        };
    }
}
