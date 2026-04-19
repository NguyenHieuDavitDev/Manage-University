package com.managestudents.dutyassignment.repository;

import com.managestudents.common.jpa.LikePatterns;
import com.managestudents.dutyassignment.entity.DutyAssignment;
import com.managestudents.user.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class DutyAssignmentSpecifications {

    private DutyAssignmentSpecifications() {
    }

    public static Specification<DutyAssignment> filter(String keyword) {
        return (root, query, cb) -> {
            Join<DutyAssignment, User> u = root.join("user", JoinType.INNER);
            Predicate notDeleted = cb.isFalse(u.get("isDeleted"));
            if (keyword == null || keyword.isBlank()) {
                return notDeleted;
            }
            query.distinct(true);
            String pattern = LikePatterns.contains(keyword);
            var f = root.join("faculty", JoinType.LEFT);
            var d = root.join("department", JoinType.LEFT);
            var p = root.join("position", JoinType.LEFT);
            List<Predicate> ors = new ArrayList<>();
            ors.add(cb.like(u.get("username"), pattern, '\\'));
            ors.add(cb.like(u.get("fullName"), pattern, '\\'));
            ors.add(cb.like(u.get("email"), pattern, '\\'));
            ors.add(cb.and(cb.isNotNull(f.get("id")), cb.like(f.get("facultyName"), pattern, '\\')));
            ors.add(cb.and(cb.isNotNull(f.get("id")), cb.like(f.get("facultyCode"), pattern, '\\')));
            ors.add(cb.and(cb.isNotNull(d.get("id")), cb.like(d.get("departmentName"), pattern, '\\')));
            ors.add(cb.and(cb.isNotNull(d.get("id")), cb.like(d.get("departmentCode"), pattern, '\\')));
            ors.add(cb.and(cb.isNotNull(p.get("id")), cb.like(p.get("positionName"), pattern, '\\')));
            ors.add(cb.and(cb.isNotNull(p.get("id")), cb.like(p.get("positionCode"), pattern, '\\')));
            return cb.and(notDeleted, cb.or(ors.toArray(new Predicate[0])));
        };
    }
}
