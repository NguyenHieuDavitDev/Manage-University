package com.managestudents.studentgrade.repository;

import com.managestudents.studentgrade.entity.StudentGrade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface StudentGradeRepository extends JpaRepository<StudentGrade, Long> {

    List<StudentGrade> findByEnrollment_CourseClass_Id(Long courseClassId);

    List<StudentGrade> findByEnrollment_IdIn(Collection<Long> enrollmentIds);

    Optional<StudentGrade> findByEnrollment_IdAndGradeComponent_Id(Long enrollmentId, Long gradeComponentId);
}
