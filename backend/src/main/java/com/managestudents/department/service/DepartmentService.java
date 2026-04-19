package com.managestudents.department.service;

import com.managestudents.department.dto.DepartmentCreateRequest;
import com.managestudents.department.dto.DepartmentResponse;
import com.managestudents.department.dto.DepartmentUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DepartmentService {

    Page<DepartmentResponse> findAll(String keyword, Pageable pageable);

    DepartmentResponse findById(Long id);

    DepartmentResponse create(DepartmentCreateRequest request);

    DepartmentResponse update(Long id, DepartmentUpdateRequest request);

    void deleteById(Long id);
}
