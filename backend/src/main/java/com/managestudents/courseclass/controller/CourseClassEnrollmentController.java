package com.managestudents.courseclass.controller;

import com.managestudents.courseclass.dto.CourseClassMemberResponse;
import com.managestudents.courseclass.dto.MyCourseClassEnrollmentResponse;
import com.managestudents.courseclass.dto.MyCourseClassEnrollmentTransferRequest;
import com.managestudents.courseclass.service.CourseClassEnrollmentService;
import com.managestudents.security.JwtPrincipal;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class CourseClassEnrollmentController {

    private final CourseClassEnrollmentService enrollmentService;

    public CourseClassEnrollmentController(CourseClassEnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    @PostMapping("/api/v1/course-classes/{courseClassId}/enrollments")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<CourseClassMemberResponse> enrollSelf(@PathVariable Long courseClassId) {
        JwtPrincipal p = requirePrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(enrollmentService.enroll(courseClassId, p.userId()));
    }

    @GetMapping("/api/v1/course-classes/{courseClassId}/enrollments")
    public ResponseEntity<List<CourseClassMemberResponse>> listMembers(@PathVariable Long courseClassId) {
        requirePrincipal();
        return ResponseEntity.ok(enrollmentService.listMembers(courseClassId));
    }

    @GetMapping("/api/v1/me/course-class-enrollments")
    public ResponseEntity<Page<MyCourseClassEnrollmentResponse>> listMine(
            @RequestParam(name = "q", required = false) String keyword,
            @PageableDefault(size = 20, sort = "enrolledAt", direction = Sort.Direction.DESC) Pageable pageable) {
        JwtPrincipal p = requirePrincipal();
        return ResponseEntity.ok(enrollmentService.listMine(p.userId(), keyword, pageable));
    }

    @GetMapping("/api/v1/me/course-class-enrollments/{enrollmentId}")
    public ResponseEntity<MyCourseClassEnrollmentResponse> getMine(@PathVariable Long enrollmentId) {
        JwtPrincipal p = requirePrincipal();
        return ResponseEntity.ok(enrollmentService.getMine(enrollmentId, p.userId()));
    }

    @PutMapping("/api/v1/me/course-class-enrollments/{enrollmentId}")
    public ResponseEntity<MyCourseClassEnrollmentResponse> transferMine(
            @PathVariable Long enrollmentId, @Valid @RequestBody MyCourseClassEnrollmentTransferRequest body) {
        JwtPrincipal p = requirePrincipal();
        return ResponseEntity.ok(enrollmentService.transferMine(enrollmentId, p.userId(), body));
    }

    @DeleteMapping("/api/v1/me/course-class-enrollments/{enrollmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void withdrawMine(@PathVariable Long enrollmentId) {
        JwtPrincipal p = requirePrincipal();
        enrollmentService.withdrawMine(enrollmentId, p.userId());
    }

    private static JwtPrincipal requirePrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof JwtPrincipal p)) {
            throw new BadCredentialsException("Cần đăng nhập");
        }
        return p;
    }
}
