package com.managestudents.role.service;

import com.managestudents.role.dto.RoleCreateRequest;
import com.managestudents.role.dto.RoleResponse;
import com.managestudents.role.dto.RoleSuggestionResponse;
import com.managestudents.role.dto.RoleUpdateRequest;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface RoleService {

    Page<RoleResponse> findAll(String keyword, Pageable pageable);

    /**
     * Gợi ý tìm kiếm theo thời gian thực (giới hạn số dòng).
     */
    List<RoleSuggestionResponse> suggest(String keyword, int limit);

    RoleResponse findById(Long id);

    RoleResponse create(RoleCreateRequest request);

    RoleResponse update(Long id, RoleUpdateRequest request);

    void deleteById(Long id);
}
