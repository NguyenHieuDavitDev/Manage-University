package com.managestudents.course.service;

import com.managestudents.course.dto.CourseCreateRequest;
import com.managestudents.course.dto.CourseResponse;
import com.managestudents.course.dto.CourseUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CourseService {

    Page<CourseResponse> findAll(String keyword, Pageable pageable);

    CourseResponse findById(Long id);

    CourseResponse create(CourseCreateRequest request);

    CourseResponse update(Long id, CourseUpdateRequest request);

    void deleteById(Long id);
}
