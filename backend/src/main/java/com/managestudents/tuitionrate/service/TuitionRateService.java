package com.managestudents.tuitionrate.service;

import com.managestudents.tuitionrate.dto.TuitionRateCreateRequest;
import com.managestudents.tuitionrate.dto.TuitionRateResponse;
import com.managestudents.tuitionrate.dto.TuitionRateUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TuitionRateService {

    Page<TuitionRateResponse> findAll(String keyword, Pageable pageable);

    TuitionRateResponse findById(Long id);

    TuitionRateResponse create(TuitionRateCreateRequest request);

    TuitionRateResponse update(Long id, TuitionRateUpdateRequest request);

    void deleteById(Long id);
}
