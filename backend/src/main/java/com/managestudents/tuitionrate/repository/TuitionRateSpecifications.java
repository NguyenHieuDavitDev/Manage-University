package com.managestudents.tuitionrate.repository;

import com.managestudents.common.jpa.LikePatterns;
import com.managestudents.tuitionrate.entity.TuitionRate;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class TuitionRateSpecifications {

    private TuitionRateSpecifications() {
    }

    public static Specification<TuitionRate> matchesKeyword(String keyword) {
        return (root, query, cb) -> {
            String pattern = LikePatterns.contains(keyword);
            List<Predicate> ors = new ArrayList<>();
            var programJoin = root.join("trainingProgram", JoinType.LEFT);
            ors.add(cb.like(root.get("tuitionCode"), pattern, '\\'));
            ors.add(cb.like(root.get("tuitionName"), pattern, '\\'));
            ors.add(cb.like(programJoin.get("programCode"), pattern, '\\'));
            ors.add(cb.like(programJoin.get("programName"), pattern, '\\'));
            ors.add(cb.and(
                    cb.isNotNull(root.get("description")),
                    cb.like(root.get("description"), pattern, '\\')
            ));
            return cb.or(ors.toArray(new Predicate[0]));
        };
    }
}
