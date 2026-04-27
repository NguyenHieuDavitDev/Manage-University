package com.managestudents.classschedule.repository;

import com.managestudents.classschedule.entity.ClassSchedule;
import com.managestudents.common.jpa.LikePatterns;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class ClassScheduleSpecifications {

    private ClassScheduleSpecifications() {
    }

    public static Specification<ClassSchedule> hasCourseClassId(Long courseClassId) {
        return (root, query, cb) -> {
            if (courseClassId == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("courseClass").get("id"), courseClassId);
        };
    }

    public static Specification<ClassSchedule> hasClassroomId(Long classroomId) {
        return (root, query, cb) -> {
            if (classroomId == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("classroom").get("id"), classroomId);
        };
    }

    public static Specification<ClassSchedule> matchesKeyword(String keyword) {
        return (root, query, cb) -> {
            String pattern = LikePatterns.contains(keyword);
            List<Predicate> ors = new ArrayList<>();
            ors.add(cb.like(root.get("courseClass").get("course").get("courseCode"), pattern, '\\'));
            ors.add(cb.like(root.get("courseClass").get("course").get("courseName"), pattern, '\\'));
            ors.add(cb.like(root.get("courseClass").get("sectionCode"), pattern, '\\'));
            ors.add(cb.like(root.get("classroom").get("roomCode"), pattern, '\\'));
            ors.add(cb.like(root.get("classroom").get("roomName"), pattern, '\\'));
            ors.add(cb.like(root.get("lecturerUser").get("username"), pattern, '\\'));
            ors.add(cb.like(root.get("lecturerUser").get("fullName"), pattern, '\\'));
            ors.add(cb.and(
                    cb.isNotNull(root.get("description")),
                    cb.like(root.get("description"), pattern, '\\')));
            return cb.or(ors.toArray(new Predicate[0]));
        };
    }
}
