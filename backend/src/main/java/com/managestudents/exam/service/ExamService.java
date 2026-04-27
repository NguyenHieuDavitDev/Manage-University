package com.managestudents.exam.service;

import com.managestudents.exam.dto.ExamAutoScheduleRequest;
import com.managestudents.exam.dto.ExamCreateRequest;
import com.managestudents.exam.dto.ExamResponse;
import com.managestudents.exam.dto.ExamUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ExamService {
    Page<ExamResponse> findAll(String keyword, Long courseClassId, Long examTypeId, Pageable pageable);
    ExamResponse findById(Long id);
    ExamResponse create(ExamCreateRequest request);
    ExamResponse update(Long id, ExamUpdateRequest request);
    void deleteById(Long id);
    List<ExamResponse> autoSchedule(ExamAutoScheduleRequest request);
}
