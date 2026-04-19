package com.managestudents.courseclass.repository;

import com.managestudents.common.jpa.LikePatterns;
import com.managestudents.course.entity.Course;
import com.managestudents.courseclass.entity.CourseClass;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class CourseClassSpecifications {

    private CourseClassSpecifications() {
    }

    public static Specification<CourseClass> filter(Long courseId, String keyword) {
        return (root, query, cb) -> {
            List<Predicate> ands = new ArrayList<>();
            Join<CourseClass, Course> courseJoin = root.join("course", JoinType.INNER);
            if (courseId != null) {
                ands.add(cb.equal(courseJoin.get("id"), courseId));
            }
            if (keyword == null || keyword.isBlank()) {
                return ands.isEmpty() ? cb.conjunction() : cb.and(ands.toArray(new Predicate[0]));
            }
            query.distinct(true);
            String pattern = LikePatterns.contains(keyword);
            List<Predicate> ors = new ArrayList<>();
            ors.add(cb.like(root.get("sectionCode"), pattern, '\\'));
            ors.add(cb.and(
                    cb.isNotNull(root.get("className")),
                    cb.like(root.get("className"), pattern, '\\')));
            ors.add(cb.like(root.get("academicYear"), pattern, '\\'));
            ors.add(cb.and(
                    cb.isNotNull(root.get("description")),
                    cb.like(root.get("description"), pattern, '\\')));
            ors.add(cb.like(courseJoin.get("courseCode"), pattern, '\\'));
            ors.add(cb.like(courseJoin.get("courseName"), pattern, '\\'));
            ands.add(cb.or(ors.toArray(new Predicate[0])));
            return cb.and(ands.toArray(new Predicate[0]));
        };
    }
}
