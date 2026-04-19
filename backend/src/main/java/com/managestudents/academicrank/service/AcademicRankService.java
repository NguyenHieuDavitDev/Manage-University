package com.managestudents.academicrank.service;

import com.managestudents.academicrank.dto.AcademicRankCreateRequest;
import com.managestudents.academicrank.dto.AcademicRankResponse;
import com.managestudents.academicrank.dto.AcademicRankUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AcademicRankService {

    Page<AcademicRankResponse> findAll(String keyword, Pageable pageable);

    AcademicRankResponse findById(Long id);

    AcademicRankResponse create(AcademicRankCreateRequest request);

    AcademicRankResponse update(Long id, AcademicRankUpdateRequest request);

    void deleteById(Long id);
}
