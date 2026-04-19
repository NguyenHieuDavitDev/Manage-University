package com.managestudents.dutyassignment.service;

import com.managestudents.dutyassignment.dto.DutyAssignmentCreateRequest;
import com.managestudents.dutyassignment.dto.DutyAssignmentOrgRequest;
import com.managestudents.dutyassignment.dto.DutyAssignmentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

public interface DutyAssignmentService {

    Page<DutyAssignmentResponse> findAll(String keyword, Pageable pageable);

    DutyAssignmentResponse findById(Long id);

    Optional<DutyAssignmentResponse> findByUserId(UUID userId);

    DutyAssignmentResponse create(DutyAssignmentCreateRequest request);

    DutyAssignmentResponse update(Long id, DutyAssignmentOrgRequest request);

    DutyAssignmentResponse upsertByUser(UUID userId, DutyAssignmentOrgRequest request);

    void deleteById(Long id);

    void deleteByUserId(UUID userId);
}
