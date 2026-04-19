package com.managestudents.insurance.repository;

import com.managestudents.insurance.entity.Insurance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface InsuranceRepository extends JpaRepository<Insurance, Long>, JpaSpecificationExecutor<Insurance> {

    @Query("select distinct i.insuranceType from Insurance i order by i.insuranceType asc")
    List<String> findDistinctInsuranceTypes();
}
