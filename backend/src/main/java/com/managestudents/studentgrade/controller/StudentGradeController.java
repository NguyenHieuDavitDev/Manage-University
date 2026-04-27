package com.managestudents.studentgrade.controller;

import com.managestudents.security.JwtPrincipal;
import com.managestudents.studentgrade.dto.StudentGradeUpsertRequest;
import com.managestudents.studentgrade.dto.StudentGradebookResponse;
import com.managestudents.studentgrade.service.StudentGradeService;
import jakarta.validation.Valid;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
public class StudentGradeController {

    private final StudentGradeService studentGradeService;

    public StudentGradeController(StudentGradeService studentGradeService) {
        this.studentGradeService = studentGradeService;
    }

    @GetMapping("/api/v1/course-classes/{courseClassId}/gradebook")
    public ResponseEntity<StudentGradebookResponse> getGradebook(@PathVariable Long courseClassId) {
        JwtPrincipal p = requirePrincipal();
        boolean isStudent = p.roleCodes() != null && p.roleCodes().stream().anyMatch("STUDENT"::equalsIgnoreCase);
        if (isStudent) {
            return ResponseEntity.ok(studentGradeService.getGradebookForStudent(courseClassId, p.userId()));
        }
        return ResponseEntity.ok(studentGradeService.getGradebook(courseClassId));
    }

    @PutMapping("/api/v1/course-classes/{courseClassId}/gradebook/students/{userId}")
    public ResponseEntity<StudentGradebookResponse> upsertStudentScores(
            @PathVariable Long courseClassId,
            @PathVariable UUID userId,
            @Valid @RequestBody StudentGradeUpsertRequest request) {
        requirePrincipal();
        return ResponseEntity.ok(studentGradeService.upsertStudentScores(courseClassId, userId, request));
    }

    @PutMapping("/api/v1/course-classes/{courseClassId}/gradebook/finalize")
    public ResponseEntity<StudentGradebookResponse> finalizeGradebook(
            @PathVariable Long courseClassId,
            @RequestParam(name = "value", defaultValue = "true") boolean finalized) {
        requirePrincipal();
        return ResponseEntity.ok(studentGradeService.finalizeGradebook(courseClassId, finalized));
    }

    @GetMapping("/api/v1/course-classes/{courseClassId}/gradebook/export")
    public ResponseEntity<InputStreamResource> exportExcel(@PathVariable Long courseClassId) {
        requirePrincipal();
        InputStreamResource resource = new InputStreamResource(studentGradeService.exportGradebookExcel(courseClassId));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=gradebook-" + courseClassId + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(resource);
    }

    @PostMapping(value = "/api/v1/course-classes/{courseClassId}/gradebook/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StudentGradebookResponse> importExcel(
            @PathVariable Long courseClassId,
            @RequestParam("file") MultipartFile file) {
        requirePrincipal();
        return ResponseEntity.ok(studentGradeService.importGradebookExcel(courseClassId, file));
    }

    private static JwtPrincipal requirePrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof JwtPrincipal p)) {
            throw new BadCredentialsException("Cần đăng nhập");
        }
        return p;
    }
}
