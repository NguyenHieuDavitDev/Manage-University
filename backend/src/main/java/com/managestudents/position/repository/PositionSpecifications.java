package com.managestudents.position.repository;

import com.managestudents.common.jpa.LikePatterns;
import com.managestudents.position.entity.Position;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class PositionSpecifications {

    private PositionSpecifications() {
    }

    public static Specification<Position> filter(String keyword, String positionCategory) {
        return (root, query, cb) -> {
            List<Predicate> ands = new ArrayList<>();
            if (positionCategory != null && !positionCategory.isBlank()) {
                ands.add(cb.equal(root.get("positionCategory"), positionCategory.trim()));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = LikePatterns.contains(keyword);
                List<Predicate> ors = new ArrayList<>();
                ors.add(cb.like(root.get("positionCode"), pattern, '\\'));
                ors.add(cb.like(root.get("positionName"), pattern, '\\'));
                ors.add(cb.and(
                        cb.isNotNull(root.get("description")),
                        cb.like(root.get("description"), pattern, '\\')
                ));
                ors.add(cb.and(
                        cb.isNotNull(root.get("positionCategory")),
                        cb.like(root.get("positionCategory"), pattern, '\\')
                ));
                ands.add(cb.or(ors.toArray(new Predicate[0])));
            }
            if (ands.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(ands.toArray(new Predicate[0]));
        };
    }
}
