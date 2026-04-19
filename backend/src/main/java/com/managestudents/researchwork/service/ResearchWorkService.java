package com.managestudents.researchwork.service;

import com.managestudents.researchwork.dto.ResearchWorkCreateRequest;
import com.managestudents.researchwork.dto.ResearchWorkResponse;
import com.managestudents.researchwork.dto.ResearchWorkUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ResearchWorkService {

    Page<ResearchWorkResponse> findAll(UUID userId, String keyword, String workType, Pageable pageable);

    List<String> listDistinctWorkTypes();

    ResearchWorkResponse findById(Long id);

    ResearchWorkResponse create(ResearchWorkCreateRequest request);

    ResearchWorkResponse update(Long id, ResearchWorkUpdateRequest request);

    void deleteById(Long id);
}
