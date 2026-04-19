package com.managestudents.academicrank.repository;

import com.managestudents.academicrank.entity.AcademicRank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AcademicRankRepository
        extends JpaRepository<AcademicRank, Long>, JpaSpecificationExecutor<AcademicRank> {

    boolean existsByRankCode(String rankCode);

    boolean existsByRankCodeAndIdNot(String rankCode, Long id);
}
