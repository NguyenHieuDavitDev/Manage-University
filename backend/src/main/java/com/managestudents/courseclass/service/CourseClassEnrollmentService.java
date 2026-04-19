package com.managestudents.courseclass.service;

import com.managestudents.courseclass.dto.CourseClassMemberResponse;
import com.managestudents.courseclass.dto.MyCourseClassEnrollmentResponse;
import com.managestudents.courseclass.dto.MyCourseClassEnrollmentTransferRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface CourseClassEnrollmentService {

    CourseClassMemberResponse enroll(Long courseClassId, UUID userId);

    List<CourseClassMemberResponse> listMembers(Long courseClassId);

    Page<MyCourseClassEnrollmentResponse> listMine(UUID userId, String keyword, Pageable pageable);

    MyCourseClassEnrollmentResponse getMine(Long enrollmentId, UUID userId);

    MyCourseClassEnrollmentResponse transferMine(
            Long enrollmentId, UUID userId, MyCourseClassEnrollmentTransferRequest request);

    void withdrawMine(Long enrollmentId, UUID userId);
}
