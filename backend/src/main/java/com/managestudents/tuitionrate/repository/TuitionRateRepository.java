package com.managestudents.tuitionrate.repository;

import com.managestudents.tuitionrate.entity.TuitionRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TuitionRateRepository extends JpaRepository<TuitionRate, Long>, JpaSpecificationExecutor<TuitionRate> {

    boolean existsByTuitionCode(String tuitionCode);

    boolean existsByTuitionCodeAndIdNot(String tuitionCode, Long id);
}
