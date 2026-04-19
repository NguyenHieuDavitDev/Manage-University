package com.managestudents.laborcontract.repository;

import com.managestudents.laborcontract.entity.LaborContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface LaborContractRepository
        extends JpaRepository<LaborContract, Long>, JpaSpecificationExecutor<LaborContract> {

    boolean existsByUser_IdAndContractNumber(UUID userId, String contractNumber);

    boolean existsByUser_IdAndContractNumberAndIdNot(UUID userId, String contractNumber, Long id);

    @Query("select distinct l.contractType from LaborContract l where l.contractType is not null order by l.contractType asc")
    List<String> findDistinctContractTypes();
}
