package com.managestudents.laborcontract.service;

import com.managestudents.laborcontract.dto.LaborContractCreateRequest;
import com.managestudents.laborcontract.dto.LaborContractResponse;
import com.managestudents.laborcontract.dto.LaborContractUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface LaborContractService {

    Page<LaborContractResponse> findAll(UUID userId, String keyword, String contractType, Pageable pageable);

    List<String> listDistinctContractTypes();

    LaborContractResponse findById(Long id);

    LaborContractResponse create(LaborContractCreateRequest request);

    LaborContractResponse update(Long id, LaborContractUpdateRequest request);

    void deleteById(Long id);
}
