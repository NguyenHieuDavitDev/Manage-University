package com.managestudents.insurance.service;

import com.managestudents.insurance.dto.InsuranceCreateRequest;
import com.managestudents.insurance.dto.InsuranceResponse;
import com.managestudents.insurance.dto.InsuranceUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface InsuranceService {

    Page<InsuranceResponse> findAll(UUID userId, String keyword, String insuranceType, Pageable pageable);

    List<String> listDistinctInsuranceTypes();

    InsuranceResponse findById(Long id);

    InsuranceResponse create(InsuranceCreateRequest request);

    InsuranceResponse update(Long id, InsuranceUpdateRequest request);

    void deleteById(Long id);
}
