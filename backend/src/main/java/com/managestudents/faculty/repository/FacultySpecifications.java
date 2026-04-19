package com.managestudents.faculty.repository;

import com.managestudents.common.jpa.LikePatterns;
import com.managestudents.faculty.entity.Faculty;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class FacultySpecifications {

    private FacultySpecifications() {
    }

    public static Specification<Faculty> matchesKeyword(String keyword) {
        return (root, query, cb) -> {
            String pattern = LikePatterns.contains(keyword);
            List<Predicate> ors = new ArrayList<>();
            ors.add(cb.like(root.get("facultyCode"), pattern, '\\'));
            ors.add(cb.like(root.get("facultyName"), pattern, '\\'));
            ors.add(cb.and(
                    cb.isNotNull(root.get("description")),
                    cb.like(root.get("description"), pattern, '\\')
            ));
            return cb.or(ors.toArray(new Predicate[0]));
        };
    }
}
