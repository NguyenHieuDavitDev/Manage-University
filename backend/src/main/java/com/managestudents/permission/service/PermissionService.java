package com.managestudents.permission.service;

import com.managestudents.permission.dto.PermissionCreateRequest;
import com.managestudents.permission.dto.PermissionResponse;
import com.managestudents.permission.dto.PermissionSuggestionResponse;
import com.managestudents.permission.dto.PermissionUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PermissionService {

    Page<PermissionResponse> findAll(String keyword, Pageable pageable);

    List<PermissionSuggestionResponse> suggest(String keyword, int limit);

    PermissionResponse findById(Long id);

    PermissionResponse create(PermissionCreateRequest request);

    PermissionResponse update(Long id, PermissionUpdateRequest request);

    void deleteById(Long id);
}
