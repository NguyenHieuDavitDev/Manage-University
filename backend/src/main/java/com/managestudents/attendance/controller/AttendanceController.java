package com.managestudents.attendance.controller;

import com.managestudents.attendance.dto.AttendanceSessionResponse;
import com.managestudents.attendance.dto.AttendanceSessionUpsertRequest;
import com.managestudents.attendance.dto.AttendanceSlotResponse;
import com.managestudents.attendance.dto.MyAttendanceDayResponse;
import com.managestudents.attendance.dto.TeachingCourseClassResponse;
import com.managestudents.attendance.service.AttendanceService;
import com.managestudents.security.JwtPrincipal;
import jakarta.validation.Valid;
import org.springframework.core.io.InputStreamResource;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.LocalDate;
import java.util.List;

@RestController
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping("/api/v1/me/teaching-course-classes")
    public ResponseEntity<List<TeachingCourseClassResponse>> listTeachingClasses() {
        JwtPrincipal p = requirePrincipal();
        return ResponseEntity.ok(attendanceService.listTeachingCourseClasses(p.userId()));
    }

    @GetMapping("/api/v1/course-classes/{courseClassId}/attendance/slots")
    public ResponseEntity<List<AttendanceSlotResponse>> listSlots(
            @PathVariable Long courseClassId,
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        JwtPrincipal p = requirePrincipal();
        return ResponseEntity.ok(attendanceService.listAttendanceSlots(courseClassId, from, to, p));
    }

    @GetMapping("/api/v1/course-classes/{courseClassId}/attendance/sessions/{classScheduleId}/{sessionDate}")
    public ResponseEntity<AttendanceSessionResponse> getSession(
            @PathVariable Long courseClassId,
            @PathVariable Long classScheduleId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate sessionDate) {
        JwtPrincipal p = requirePrincipal();
        return ResponseEntity.ok(attendanceService.getSession(courseClassId, classScheduleId, sessionDate, p));
    }

    @PutMapping("/api/v1/course-classes/{courseClassId}/attendance/sessions/{classScheduleId}/{sessionDate}")
    public ResponseEntity<AttendanceSessionResponse> upsertSession(
            @PathVariable Long courseClassId,
            @PathVariable Long classScheduleId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate sessionDate,
            @Valid @RequestBody AttendanceSessionUpsertRequest request) {
        JwtPrincipal p = requirePrincipal();
        return ResponseEntity.ok(
                attendanceService.upsertSession(courseClassId, classScheduleId, sessionDate, request, p));
    }

    @GetMapping("/api/v1/course-classes/{courseClassId}/attendance/sessions/{classScheduleId}/{sessionDate}/export")
    public ResponseEntity<InputStreamResource> exportSessionExcel(
            @PathVariable Long courseClassId,
            @PathVariable Long classScheduleId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate sessionDate) {
        JwtPrincipal p = requirePrincipal();
        String filename =
                "attendance-" + courseClassId + "-" + classScheduleId + "-" + sessionDate + ".xlsx";
        InputStreamResource resource =
                new InputStreamResource(attendanceService.exportSessionExcel(courseClassId, classScheduleId, sessionDate, p));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(resource);
    }

    @PostMapping(
            value = "/api/v1/course-classes/{courseClassId}/attendance/sessions/{classScheduleId}/{sessionDate}/import",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AttendanceSessionResponse> importSessionExcel(
            @PathVariable Long courseClassId,
            @PathVariable Long classScheduleId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate sessionDate,
            @RequestParam("file") MultipartFile file) {
        JwtPrincipal p = requirePrincipal();
        return ResponseEntity.ok(
                attendanceService.importSessionExcel(courseClassId, classScheduleId, sessionDate, file, p));
    }

    @GetMapping("/api/v1/me/course-classes/{courseClassId}/attendance")
    public ResponseEntity<List<MyAttendanceDayResponse>> listMyAttendance(
            @PathVariable Long courseClassId,
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        JwtPrincipal p = requirePrincipal();
        return ResponseEntity.ok(attendanceService.listMyAttendanceInClass(courseClassId, p.userId(), from, to));
    }

    private static JwtPrincipal requirePrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof JwtPrincipal p)) {
            throw new BadCredentialsException("Cần đăng nhập");
        }
        return p;
    }
}
