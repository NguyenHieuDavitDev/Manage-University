package com.managestudents.exam.repository;

import com.managestudents.exam.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.util.List;

public interface ExamRepository extends JpaRepository<Exam, Long>, JpaSpecificationExecutor<Exam> {
    List<Exam> findByExamDateBetween(LocalDate fromDate, LocalDate toDate);
    boolean existsByCourseClass_IdAndExamType_Id(Long courseClassId, Long examTypeId);
}
