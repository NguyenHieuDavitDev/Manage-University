package com.managestudents.attendance.service;

import com.managestudents.attendance.dto.AttendanceSessionResponse;
import com.managestudents.attendance.dto.AttendanceSessionUpsertRequest;
import com.managestudents.attendance.dto.AttendanceSlotResponse;
import com.managestudents.attendance.dto.MyAttendanceDayResponse;
import com.managestudents.attendance.dto.TeachingCourseClassResponse;
import com.managestudents.security.JwtPrincipal;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface AttendanceService {

    List<TeachingCourseClassResponse> listTeachingCourseClasses(UUID lecturerUserId);

    List<AttendanceSlotResponse> listAttendanceSlots(
            Long courseClassId, LocalDate fromInclusive, LocalDate toInclusive, JwtPrincipal principal);

    AttendanceSessionResponse getSession(
            Long courseClassId, Long classScheduleId, LocalDate sessionDate, JwtPrincipal principal);

    AttendanceSessionResponse upsertSession(
            Long courseClassId,
            Long classScheduleId,
            LocalDate sessionDate,
            AttendanceSessionUpsertRequest request,
            JwtPrincipal principal);

    ByteArrayInputStream exportSessionExcel(
            Long courseClassId, Long classScheduleId, LocalDate sessionDate, JwtPrincipal principal);

    AttendanceSessionResponse importSessionExcel(
            Long courseClassId,
            Long classScheduleId,
            LocalDate sessionDate,
            MultipartFile file,
            JwtPrincipal principal);

    List<MyAttendanceDayResponse> listMyAttendanceInClass(
            Long courseClassId, UUID studentUserId, LocalDate fromInclusive, LocalDate toInclusive);
}
