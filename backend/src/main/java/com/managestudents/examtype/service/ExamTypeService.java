package com.managestudents.examtype.service;

import com.managestudents.examtype.dto.ExamTypeCreateRequest;
import com.managestudents.examtype.dto.ExamTypeResponse;
import com.managestudents.examtype.dto.ExamTypeUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ExamTypeService {

    Page<ExamTypeResponse> findAll(String keyword, Pageable pageable);

    ExamTypeResponse findById(Long id);

    ExamTypeResponse create(ExamTypeCreateRequest request);

    ExamTypeResponse update(Long id, ExamTypeUpdateRequest request);

    void deleteById(Long id);
}
