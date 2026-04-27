package com.managestudents.examtype.repository;

import com.managestudents.common.jpa.LikePatterns;
import com.managestudents.examtype.entity.ExamType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class ExamTypeSpecifications {

    private ExamTypeSpecifications() {
    }

    public static Specification<ExamType> matchesKeyword(String keyword) {
        return (root, query, cb) -> {
            String pattern = LikePatterns.contains(keyword);
            List<Predicate> ors = new ArrayList<>();
            ors.add(cb.like(root.get("examTypeCode"), pattern, '\\'));
            ors.add(cb.like(root.get("examTypeName"), pattern, '\\'));
            ors.add(cb.and(
                    cb.isNotNull(root.get("description")),
                    cb.like(root.get("description"), pattern, '\\')
            ));
            return cb.or(ors.toArray(new Predicate[0]));
        };
    }
}
