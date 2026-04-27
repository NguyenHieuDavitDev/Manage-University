package com.managestudents.examtype.repository;

import com.managestudents.examtype.entity.ExamType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ExamTypeRepository extends JpaRepository<ExamType, Long>, JpaSpecificationExecutor<ExamType> {

    boolean existsByExamTypeCode(String examTypeCode);

    boolean existsByExamTypeCodeAndIdNot(String examTypeCode, Long id);
}
