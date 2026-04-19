package com.managestudents.faculty.service;

import com.managestudents.faculty.dto.FacultyCreateRequest;
import com.managestudents.faculty.dto.FacultyResponse;
import com.managestudents.faculty.dto.FacultyUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FacultyService {

    Page<FacultyResponse> findAll(String keyword, Pageable pageable);

    FacultyResponse findById(Long id);

    FacultyResponse create(FacultyCreateRequest request);

    FacultyResponse update(Long id, FacultyUpdateRequest request);

    void deleteById(Long id);
}
