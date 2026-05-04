package com.managestudents.studenttuition.repository;

import com.managestudents.studenttuition.entity.StudentTuition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface StudentTuitionRepository extends JpaRepository<StudentTuition, Long>, JpaSpecificationExecutor<StudentTuition> {

    boolean existsByUser_IdAndAcademicYearAndSemester(UUID userId, String academicYear, Integer semester);

    boolean existsByUser_IdAndAcademicYearAndSemesterAndIdNot(UUID userId, String academicYear, Integer semester, Long id);
}
