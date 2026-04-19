package com.managestudents.courseclass.repository;

import com.managestudents.common.jpa.LikePatterns;
import com.managestudents.course.entity.Course;
import com.managestudents.courseclass.entity.CourseClass;
import com.managestudents.courseclass.entity.CourseClassEnrollment;
import com.managestudents.user.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class CourseClassEnrollmentSpecifications {

    private CourseClassEnrollmentSpecifications() {
    }

    /**
     * Đăng ký của một user, lọc gần đúng theo mã/tên học phần, mã lớp, tên lớp, năm học.
     */
    public static Specification<CourseClassEnrollment> mineFilter(UUID userId, String keyword) {
        return (root, query, cb) -> {
            Join<CourseClassEnrollment, User> userJoin = root.join("user", JoinType.INNER);
            Predicate userMatch = cb.equal(userJoin.get("id"), userId);
            if (keyword == null || keyword.isBlank()) {
                return userMatch;
            }
            query.distinct(true);
            Join<CourseClassEnrollment, CourseClass> ccJoin = root.join("courseClass", JoinType.INNER);
            Join<CourseClass, Course> courseJoin = ccJoin.join("course", JoinType.INNER);
            String pattern = LikePatterns.contains(keyword);
            List<Predicate> ors = new ArrayList<>();
            ors.add(cb.like(ccJoin.get("sectionCode"), pattern, '\\'));
            ors.add(cb.like(ccJoin.get("academicYear"), pattern, '\\'));
            ors.add(cb.and(
                    cb.isNotNull(ccJoin.get("className")),
                    cb.like(ccJoin.get("className"), pattern, '\\')));
            ors.add(cb.like(courseJoin.get("courseCode"), pattern, '\\'));
            ors.add(cb.like(courseJoin.get("courseName"), pattern, '\\'));
            return cb.and(userMatch, cb.or(ors.toArray(new Predicate[0])));
        };
    }
}
