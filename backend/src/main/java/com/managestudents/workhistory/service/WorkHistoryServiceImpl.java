package com.managestudents.workhistory.service;

import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.user.entity.User;
import com.managestudents.user.repository.UserRepository;
import com.managestudents.workhistory.dto.WorkHistoryCreateRequest;
import com.managestudents.workhistory.dto.WorkHistoryResponse;
import com.managestudents.workhistory.dto.WorkHistoryUpdateRequest;
import com.managestudents.workhistory.entity.WorkHistory;
import com.managestudents.workhistory.repository.WorkHistoryRepository;
import com.managestudents.workhistory.repository.WorkHistorySpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class WorkHistoryServiceImpl implements WorkHistoryService {

    private final WorkHistoryRepository workHistoryRepository;
    private final UserRepository userRepository;

    public WorkHistoryServiceImpl(
            WorkHistoryRepository workHistoryRepository,
            UserRepository userRepository) {
        this.workHistoryRepository = workHistoryRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkHistoryResponse> findAll(UUID userId, String keyword, Pageable pageable) {
        Specification<WorkHistory> spec = WorkHistorySpecifications.filter(userId, keyword);
        return workHistoryRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkHistoryResponse findById(Long id) {
        WorkHistory e = workHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quá trình làm việc"));
        return toResponse(e);
    }

    @Override
    @Transactional
    public WorkHistoryResponse create(WorkHistoryCreateRequest request) {
        UUID userId = request.getUserId();
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy người dùng");
        }
        WorkHistory e = new WorkHistory();
        e.setUser(userRepository.getReferenceById(userId));
        applyBody(e, request.getOrganizationName(), request.getJobTitle(),
                request.getFromDate(), request.getToDate(), request.getDescription());
        return toResponse(workHistoryRepository.save(e));
    }

    @Override
    @Transactional
    public WorkHistoryResponse update(Long id, WorkHistoryUpdateRequest request) {
        WorkHistory e = workHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quá trình làm việc"));
        UUID userId = request.getUserId();
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy người dùng");
        }
        e.setUser(userRepository.getReferenceById(userId));
        applyBody(e, request.getOrganizationName(), request.getJobTitle(),
                request.getFromDate(), request.getToDate(), request.getDescription());
        return toResponse(workHistoryRepository.save(e));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!workHistoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy quá trình làm việc");
        }
        workHistoryRepository.deleteById(id);
    }

    private static void applyBody(
            WorkHistory e,
            String org,
            String job,
            java.time.LocalDate from,
            java.time.LocalDate to,
            String description) {
        e.setOrganizationName(org == null ? "" : org.trim());
        e.setJobTitle(job == null ? "" : job.trim());
        e.setFromDate(from);
        e.setToDate(to);
        e.setDescription(trimToNull(description));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private WorkHistoryResponse toResponse(WorkHistory e) {
        User u = e.getUser();
        WorkHistoryResponse dto = new WorkHistoryResponse();
        dto.setId(e.getId());
        dto.setUserId(u.getId());
        dto.setUserFullName(u.getFullName());
        dto.setOrganizationName(e.getOrganizationName());
        dto.setJobTitle(e.getJobTitle());
        dto.setFromDate(e.getFromDate());
        dto.setToDate(e.getToDate());
        dto.setDescription(e.getDescription());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }
}
