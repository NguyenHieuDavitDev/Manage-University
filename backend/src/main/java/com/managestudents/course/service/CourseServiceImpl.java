package com.managestudents.course.service;

import com.managestudents.common.exception.DuplicateResourceFieldException;
import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.course.dto.CourseCreateRequest;
import com.managestudents.course.dto.CourseResponse;
import com.managestudents.course.dto.CourseUpdateRequest;
import com.managestudents.course.entity.Course;
import com.managestudents.course.repository.CourseRepository;
import com.managestudents.course.repository.CourseSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;

    public CourseServiceImpl(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CourseResponse> findAll(String keyword, Pageable pageable) {
        Page<Course> page;
        if (keyword == null || keyword.isBlank()) {
            page = courseRepository.findAll(pageable);
        } else {
            Specification<Course> spec = CourseSpecifications.matchesKeyword(keyword);
            page = courseRepository.findAll(spec, pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CourseResponse findById(Long id) {
        Course entity = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học phần"));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public CourseResponse create(CourseCreateRequest request) {
        String code = normalize(request.getCourseCode());
        if (courseRepository.existsByCourseCode(code)) {
            throw new DuplicateResourceFieldException("courseCode", "Mã học phần đã tồn tại");
        }
        Course c = new Course();
        apply(c, code, request.getCourseName(), request.getCredits(), request.getDescription());
        return toResponse(courseRepository.save(c));
    }

    @Override
    @Transactional
    public CourseResponse update(Long id, CourseUpdateRequest request) {
        Course c = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học phần"));
        String code = normalize(request.getCourseCode());
        if (courseRepository.existsByCourseCodeAndIdNot(code, id)) {
            throw new DuplicateResourceFieldException("courseCode", "Mã học phần đã tồn tại");
        }
        apply(c, code, request.getCourseName(), request.getCredits(), request.getDescription());
        return toResponse(courseRepository.save(c));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy học phần");
        }
        courseRepository.deleteById(id);
    }

    private static String normalize(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private static void apply(Course c, String code, String name, Integer credits, String description) {
        c.setCourseCode(code);
        c.setCourseName(name == null ? "" : name.trim());
        c.setCredits(credits);
        c.setDescription(trimToNull(description));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private CourseResponse toResponse(Course c) {
        CourseResponse dto = new CourseResponse();
        dto.setId(c.getId());
        dto.setCourseCode(c.getCourseCode());
        dto.setCourseName(c.getCourseName());
        dto.setCredits(c.getCredits());
        dto.setDescription(c.getDescription());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setUpdatedAt(c.getUpdatedAt());
        return dto;
    }
}
