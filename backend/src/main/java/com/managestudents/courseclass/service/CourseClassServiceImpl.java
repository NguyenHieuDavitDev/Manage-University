package com.managestudents.courseclass.service;

import com.managestudents.common.exception.DuplicateResourceFieldException;
import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.course.entity.Course;
import com.managestudents.course.repository.CourseRepository;
import com.managestudents.courseclass.dto.CourseClassCreateRequest;
import com.managestudents.courseclass.dto.CourseClassResponse;
import com.managestudents.courseclass.dto.CourseClassUpdateRequest;
import com.managestudents.courseclass.entity.CourseClass;
import com.managestudents.courseclass.repository.CourseClassEnrollmentRepository;
import com.managestudents.courseclass.repository.CourseClassRepository;
import com.managestudents.courseclass.repository.CourseClassSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CourseClassServiceImpl implements CourseClassService {

    private final CourseClassRepository courseClassRepository;
    private final CourseRepository courseRepository;
    private final CourseClassEnrollmentRepository courseClassEnrollmentRepository;

    public CourseClassServiceImpl(
            CourseClassRepository courseClassRepository,
            CourseRepository courseRepository,
            CourseClassEnrollmentRepository courseClassEnrollmentRepository) {
        this.courseClassRepository = courseClassRepository;
        this.courseRepository = courseRepository;
        this.courseClassEnrollmentRepository = courseClassEnrollmentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CourseClassResponse> findAll(Long courseId, String keyword, Pageable pageable) {
        Specification<CourseClass> spec = CourseClassSpecifications.filter(courseId, keyword);
        return courseClassRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CourseClassResponse findById(Long id) {
        CourseClass e = courseClassRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
        return toResponse(e);
    }

    @Override
    @Transactional
    public CourseClassResponse create(CourseClassCreateRequest request) {
        Long courseId = request.getCourseId();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học phần"));
        String section = normalizeSectionCode(request.getSectionCode());
        if (courseClassRepository.existsByCourse_IdAndSectionCode(courseId, section)) {
            throw new DuplicateResourceFieldException("sectionCode", "Mã lớp đã tồn tại cho học phần này");
        }
        CourseClass e = new CourseClass();
        e.setCourse(course);
        apply(e, section, request.getClassName(), request.getAcademicYear(), request.getSemester(),
                request.getCapacity(), request.getDescription());
        return toResponse(courseClassRepository.save(e));
    }

    @Override
    @Transactional
    public CourseClassResponse update(Long id, CourseClassUpdateRequest request) {
        CourseClass e = courseClassRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
        Long courseId = request.getCourseId();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học phần"));
        String section = normalizeSectionCode(request.getSectionCode());
        if (courseClassRepository.existsByCourse_IdAndSectionCodeAndIdNot(courseId, section, id)) {
            throw new DuplicateResourceFieldException("sectionCode", "Mã lớp đã tồn tại cho học phần này");
        }
        e.setCourse(course);
        apply(e, section, request.getClassName(), request.getAcademicYear(), request.getSemester(),
                request.getCapacity(), request.getDescription());
        return toResponse(courseClassRepository.save(e));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!courseClassRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy lớp học phần");
        }
        courseClassEnrollmentRepository.deleteByCourseClass_Id(id);
        courseClassRepository.deleteById(id);
    }

    private static String normalizeSectionCode(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private static void apply(
            CourseClass e,
            String sectionCode,
            String className,
            String academicYear,
            Integer semester,
            Integer capacity,
            String description) {
        e.setSectionCode(sectionCode);
        e.setClassName(trimToNull(className));
        e.setAcademicYear(academicYear == null ? "" : academicYear.trim());
        e.setSemester(semester);
        e.setCapacity(capacity);
        e.setDescription(trimToNull(description));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private CourseClassResponse toResponse(CourseClass e) {
        CourseClassResponse dto = new CourseClassResponse();
        dto.setId(e.getId());
        Course c = e.getCourse();
        dto.setCourseId(c.getId());
        dto.setCourseCode(c.getCourseCode());
        dto.setCourseName(c.getCourseName());
        dto.setSectionCode(e.getSectionCode());
        dto.setClassName(e.getClassName());
        dto.setAcademicYear(e.getAcademicYear());
        dto.setSemester(e.getSemester());
        dto.setCapacity(e.getCapacity());
        long n = courseClassEnrollmentRepository.countByCourseClass_Id(e.getId());
        dto.setEnrolledCount(n > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) n);
        dto.setDescription(e.getDescription());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }
}
