package com.managestudents.courseclass.service;

import com.managestudents.common.exception.DuplicateResourceFieldException;
import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.course.entity.Course;
import com.managestudents.courseclass.dto.CourseClassMemberResponse;
import com.managestudents.courseclass.dto.MyCourseClassEnrollmentResponse;
import com.managestudents.courseclass.dto.MyCourseClassEnrollmentTransferRequest;
import com.managestudents.courseclass.entity.CourseClass;
import com.managestudents.courseclass.entity.CourseClassEnrollment;
import com.managestudents.courseclass.repository.CourseClassEnrollmentRepository;
import com.managestudents.courseclass.repository.CourseClassEnrollmentSpecifications;
import com.managestudents.courseclass.repository.CourseClassRepository;
import com.managestudents.user.entity.User;
import com.managestudents.user.entity.UserStatus;
import com.managestudents.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class CourseClassEnrollmentServiceImpl implements CourseClassEnrollmentService {

    private final CourseClassEnrollmentRepository enrollmentRepository;
    private final CourseClassRepository courseClassRepository;
    private final UserRepository userRepository;

    public CourseClassEnrollmentServiceImpl(
            CourseClassEnrollmentRepository enrollmentRepository,
            CourseClassRepository courseClassRepository,
            UserRepository userRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.courseClassRepository = courseClassRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public CourseClassMemberResponse enroll(Long courseClassId, UUID userId) {
        User user = userRepository
                .findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new BadCredentialsException("Người dùng không tồn tại"));
        if (user.getStatus() != UserStatus.Active) {
            throw new IllegalArgumentException("Tài khoản không hoạt động, không thể đăng ký.");
        }
        CourseClass courseClass = courseClassRepository
                .findById(courseClassId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
        if (enrollmentRepository.existsByUser_IdAndCourseClass_Id(userId, courseClassId)) {
            throw new DuplicateResourceFieldException("courseClassId", "Bạn đã đăng ký lớp này.");
        }
        Integer cap = courseClass.getCapacity();
        if (cap != null && cap > 0) {
            long enrolled = enrollmentRepository.countByCourseClass_Id(courseClassId);
            if (enrolled >= cap) {
                throw new IllegalArgumentException("Lớp đã đủ sĩ số.");
            }
        }
        CourseClassEnrollment row = new CourseClassEnrollment();
        row.setUser(user);
        row.setCourseClass(courseClass);
        CourseClassEnrollment saved = enrollmentRepository.save(row);
        return toMemberResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseClassMemberResponse> listMembers(Long courseClassId) {
        if (!courseClassRepository.existsById(courseClassId)) {
            throw new ResourceNotFoundException("Không tìm thấy lớp học phần");
        }
        return enrollmentRepository.findByCourseClass_IdOrderByEnrolledAtAsc(courseClassId).stream()
                .map(this::toMemberResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MyCourseClassEnrollmentResponse> listMine(UUID userId, String keyword, Pageable pageable) {
        if (keyword == null || keyword.isBlank()) {
            return enrollmentRepository.findByUser_Id(userId, pageable).map(this::toMineResponse);
        }
        Specification<CourseClassEnrollment> spec = CourseClassEnrollmentSpecifications.mineFilter(userId, keyword);
        return enrollmentRepository.findAll(spec, pageable).map(this::toMineResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public MyCourseClassEnrollmentResponse getMine(Long enrollmentId, UUID userId) {
        CourseClassEnrollment e = enrollmentRepository
                .findByIdAndUser_Id(enrollmentId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đăng ký"));
        return toMineResponse(e);
    }

    @Override
    @Transactional
    public MyCourseClassEnrollmentResponse transferMine(
            Long enrollmentId, UUID userId, MyCourseClassEnrollmentTransferRequest request) {
        CourseClassEnrollment e = enrollmentRepository
                .findByIdAndUser_Id(enrollmentId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đăng ký"));
        User user = e.getUser();
        if (user.getStatus() != UserStatus.Active) {
            throw new IllegalArgumentException("Tài khoản không hoạt động, không thể đổi lớp.");
        }
        CourseClass current = e.getCourseClass();
        Long targetId = request.getCourseClassId();
        CourseClass target = courseClassRepository
                .findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần đích"));
        if (!Objects.equals(current.getCourse().getId(), target.getCourse().getId())) {
            throw new IllegalArgumentException("Chỉ được chuyển sang lớp khác trong cùng học phần.");
        }
        if (Objects.equals(current.getId(), target.getId())) {
            return toMineResponse(e);
        }
        if (enrollmentRepository.existsByUser_IdAndCourseClass_Id(userId, targetId)) {
            throw new DuplicateResourceFieldException("courseClassId", "Bạn đã có đăng ký ở lớp đích.");
        }
        Integer cap = target.getCapacity();
        if (cap != null && cap > 0) {
            long enrolled = enrollmentRepository.countByCourseClass_Id(targetId);
            if (enrolled >= cap) {
                throw new IllegalArgumentException("Lớp đích đã đủ sĩ số.");
            }
        }
        e.setCourseClass(target);
        CourseClassEnrollment saved = enrollmentRepository.save(e);
        return toMineResponse(saved);
    }

    @Override
    @Transactional
    public void withdrawMine(Long enrollmentId, UUID userId) {
        CourseClassEnrollment e = enrollmentRepository
                .findByIdAndUser_Id(enrollmentId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đăng ký"));
        enrollmentRepository.delete(e);
    }

    private CourseClassMemberResponse toMemberResponse(CourseClassEnrollment e) {
        User u = e.getUser();
        CourseClassMemberResponse dto = new CourseClassMemberResponse();
        dto.setUserId(u.getId());
        dto.setUsername(u.getUsername());
        dto.setFullName(u.getFullName());
        dto.setEnrolledAt(e.getEnrolledAt());
        return dto;
    }

    private MyCourseClassEnrollmentResponse toMineResponse(CourseClassEnrollment e) {
        CourseClass cc = e.getCourseClass();
        Course c = cc.getCourse();
        MyCourseClassEnrollmentResponse dto = new MyCourseClassEnrollmentResponse();
        dto.setEnrollmentId(e.getId());
        dto.setCourseClassId(cc.getId());
        dto.setCourseId(c.getId());
        dto.setCourseCode(c.getCourseCode());
        dto.setCourseName(c.getCourseName());
        dto.setSectionCode(cc.getSectionCode());
        dto.setClassName(cc.getClassName());
        dto.setAcademicYear(cc.getAcademicYear());
        dto.setSemester(cc.getSemester());
        dto.setEnrolledAt(e.getEnrolledAt());
        return dto;
    }
}
