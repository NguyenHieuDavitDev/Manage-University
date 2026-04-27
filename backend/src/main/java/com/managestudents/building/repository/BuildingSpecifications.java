package com.managestudents.building.repository;

import com.managestudents.building.entity.Building;
import com.managestudents.common.jpa.LikePatterns;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class BuildingSpecifications {

    private BuildingSpecifications() {
    }

    public static Specification<Building> matchesKeyword(String keyword) {
        return (root, query, cb) -> {
            String pattern = LikePatterns.contains(keyword);
            List<Predicate> ors = new ArrayList<>();
            ors.add(cb.like(root.get("buildingCode"), pattern, '\\'));
            ors.add(cb.like(root.get("buildingName"), pattern, '\\'));
            ors.add(cb.and(
                    cb.isNotNull(root.get("description")),
                    cb.like(root.get("description"), pattern, '\\')
            ));
            return cb.or(ors.toArray(new Predicate[0]));
        };
    }
}
