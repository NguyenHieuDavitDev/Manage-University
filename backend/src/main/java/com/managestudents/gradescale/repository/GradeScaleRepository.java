package com.managestudents.gradescale.repository;

import com.managestudents.gradescale.entity.GradeScale;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GradeScaleRepository extends JpaRepository<GradeScale, Long> {

    boolean existsByLetterGrade(String letterGrade);

    boolean existsByLetterGradeAndIdNot(String letterGrade, Long id);

    List<GradeScale> findAllByOrderByMinScoreDesc();
}
