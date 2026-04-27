package com.managestudents.exam.repository;

import com.managestudents.common.jpa.LikePatterns;
import com.managestudents.exam.entity.Exam;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class ExamSpecifications {
    private ExamSpecifications() {}

    public static Specification<Exam> hasCourseClassId(Long courseClassId) {
        return (root, query, cb) -> courseClassId == null ? cb.conjunction()
                : cb.equal(root.get("courseClass").get("id"), courseClassId);
    }

    public static Specification<Exam> hasExamTypeId(Long examTypeId) {
        return (root, query, cb) -> examTypeId == null ? cb.conjunction()
                : cb.equal(root.get("examType").get("id"), examTypeId);
    }

    public static Specification<Exam> matchesKeyword(String keyword) {
        return (root, query, cb) -> {
            String pattern = LikePatterns.contains(keyword);
            List<Predicate> ors = new ArrayList<>();
            ors.add(cb.like(root.get("courseClass").get("course").get("courseCode"), pattern, '\\'));
            ors.add(cb.like(root.get("courseClass").get("course").get("courseName"), pattern, '\\'));
            ors.add(cb.like(root.get("courseClass").get("sectionCode"), pattern, '\\'));
            ors.add(cb.like(root.get("classroom").get("roomCode"), pattern, '\\'));
            ors.add(cb.like(root.get("examType").get("examTypeCode"), pattern, '\\'));
            return cb.or(ors.toArray(new Predicate[0]));
        };
    }
}
