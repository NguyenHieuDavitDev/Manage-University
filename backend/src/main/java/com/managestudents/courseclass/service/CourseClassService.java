package com.managestudents.courseclass.service;

import com.managestudents.courseclass.dto.CourseClassCreateRequest;
import com.managestudents.courseclass.dto.CourseClassResponse;
import com.managestudents.courseclass.dto.CourseClassUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CourseClassService {

    Page<CourseClassResponse> findAll(Long courseId, String keyword, Pageable pageable);

    CourseClassResponse findById(Long id);

    CourseClassResponse create(CourseClassCreateRequest request);

    CourseClassResponse update(Long id, CourseClassUpdateRequest request);

    void deleteById(Long id);
}
