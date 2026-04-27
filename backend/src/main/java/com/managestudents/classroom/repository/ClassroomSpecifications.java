package com.managestudents.classroom.repository;

import com.managestudents.classroom.entity.Classroom;
import com.managestudents.common.jpa.LikePatterns;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class ClassroomSpecifications {

    private ClassroomSpecifications() {
    }

    public static Specification<Classroom> hasBuildingId(Long buildingId) {
        return (root, query, cb) -> {
            if (buildingId == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("building").get("id"), buildingId);
        };
    }

    public static Specification<Classroom> matchesKeyword(String keyword) {
        return (root, query, cb) -> {
            String pattern = LikePatterns.contains(keyword);
            List<Predicate> ors = new ArrayList<>();
            ors.add(cb.like(root.get("roomCode"), pattern, '\\'));
            ors.add(cb.like(root.get("roomName"), pattern, '\\'));
            ors.add(cb.like(root.get("building").get("buildingCode"), pattern, '\\'));
            ors.add(cb.like(root.get("building").get("buildingName"), pattern, '\\'));
            ors.add(cb.and(
                    cb.isNotNull(root.get("description")),
                    cb.like(root.get("description"), pattern, '\\')
            ));
            return cb.or(ors.toArray(new Predicate[0]));
        };
    }
}
