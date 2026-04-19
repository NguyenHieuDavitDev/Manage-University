package com.managestudents.workhistory.service;

import com.managestudents.workhistory.dto.WorkHistoryCreateRequest;
import com.managestudents.workhistory.dto.WorkHistoryResponse;
import com.managestudents.workhistory.dto.WorkHistoryUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface WorkHistoryService {

    Page<WorkHistoryResponse> findAll(UUID userId, String keyword, Pageable pageable);

    WorkHistoryResponse findById(Long id);

    WorkHistoryResponse create(WorkHistoryCreateRequest request);

    WorkHistoryResponse update(Long id, WorkHistoryUpdateRequest request);

    void deleteById(Long id);
}
