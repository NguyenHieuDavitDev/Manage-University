package com.managestudents.gradecomponent.service;

import com.managestudents.gradecomponent.dto.GradeComponentCreateRequest;
import com.managestudents.gradecomponent.dto.GradeComponentResponse;
import com.managestudents.gradecomponent.dto.GradeComponentUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GradeComponentService {

    Page<GradeComponentResponse> findAll(String keyword, Pageable pageable);

    GradeComponentResponse findById(Long id);

    GradeComponentResponse create(GradeComponentCreateRequest request);

    GradeComponentResponse update(Long id, GradeComponentUpdateRequest request);

    void deleteById(Long id);
}
