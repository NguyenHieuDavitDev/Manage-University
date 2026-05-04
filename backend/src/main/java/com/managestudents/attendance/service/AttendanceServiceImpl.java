package com.managestudents.attendance.service;

import com.managestudents.attendance.dto.AttendanceSessionResponse;
import com.managestudents.attendance.dto.AttendanceSessionStudentRowResponse;
import com.managestudents.attendance.dto.AttendanceSessionUpsertItem;
import com.managestudents.attendance.dto.AttendanceSessionUpsertRequest;
import com.managestudents.attendance.dto.AttendanceSlotResponse;
import com.managestudents.attendance.dto.MyAttendanceDayResponse;
import com.managestudents.attendance.dto.TeachingCourseClassResponse;
import com.managestudents.attendance.entity.AttendanceStatus;
import com.managestudents.attendance.entity.ClassAttendance;
import com.managestudents.attendance.repository.ClassAttendanceRepository;
import com.managestudents.auth.PortalRouting;
import com.managestudents.classschedule.entity.ClassSchedule;
import com.managestudents.classschedule.repository.ClassScheduleRepository;
import com.managestudents.classroom.entity.Classroom;
import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.courseclass.entity.CourseClass;
import com.managestudents.courseclass.entity.CourseClassEnrollment;
import com.managestudents.courseclass.repository.CourseClassEnrollmentRepository;
import com.managestudents.courseclass.repository.CourseClassRepository;
import com.managestudents.security.JwtPrincipal;
import com.managestudents.user.entity.User;
import com.managestudents.user.repository.UserRepository;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AttendanceServiceImpl implements AttendanceService {

    private static final DataFormatter CELL_FORMATTER = new DataFormatter();

    private final ClassScheduleRepository classScheduleRepository;
    private final CourseClassRepository courseClassRepository;
    private final CourseClassEnrollmentRepository enrollmentRepository;
    private final ClassAttendanceRepository classAttendanceRepository;
    private final UserRepository userRepository;

    public AttendanceServiceImpl(
            ClassScheduleRepository classScheduleRepository,
            CourseClassRepository courseClassRepository,
            CourseClassEnrollmentRepository enrollmentRepository,
            ClassAttendanceRepository classAttendanceRepository,
            UserRepository userRepository) {
        this.classScheduleRepository = classScheduleRepository;
        this.courseClassRepository = courseClassRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.classAttendanceRepository = classAttendanceRepository;
        this.userRepository = userRepository;
    }

    /** Thứ 2..CN theo quy ước TKB (2..8), khớp {@code class_schedules.day_of_week}. */
    static int vietnameseDayOfWeek(LocalDate date) {
        DayOfWeek dow = date.getDayOfWeek();
        return dow.getValue() + 1;
    }

    static String vietnameseDayLabel(int dayOfWeek) {
        if (dayOfWeek == 8) {
            return "Chủ nhật";
        }
        if (dayOfWeek >= 2 && dayOfWeek <= 7) {
            return "Thứ " + dayOfWeek;
        }
        return "Thứ " + dayOfWeek;
    }

    private static boolean isAdmin(JwtPrincipal principal) {
        Set<String> roles = PortalRouting.normalizedRoleCodes(principal.roleCodes());
        return roles.contains("ADMIN");
    }

    private void assertCanListSlots(Long courseClassId, JwtPrincipal principal) {
        courseClassRepository
                .findById(courseClassId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
        if (isAdmin(principal)) {
            return;
        }
        if (classScheduleRepository.existsByCourseClass_IdAndLecturerUser_Id(courseClassId, principal.userId())) {
            return;
        }
        throw new AccessDeniedException("Bạn không được phân công giảng dạy lớp này trên thời khóa biểu.");
    }

    private ClassSchedule resolveScheduleForSession(Long courseClassId, Long classScheduleId, LocalDate sessionDate) {
        ClassSchedule cs = classScheduleRepository
                .findById(classScheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tiết trên thời khóa biểu"));
        if (!cs.getCourseClass().getId().equals(courseClassId)) {
            throw new IllegalArgumentException("Tiết học không thuộc lớp học phần đã chọn.");
        }
        if (sessionDate.isBefore(cs.getStartDate()) || sessionDate.isAfter(cs.getEndDate())) {
            throw new IllegalArgumentException("Ngày không nằm trong khoảng hiệu lực của tiết trên TKB.");
        }
        if (vietnameseDayOfWeek(sessionDate) != cs.getDayOfWeek()) {
            throw new IllegalArgumentException("Ngày không trùng thứ của tiết trên TKB.");
        }
        return cs;
    }

    private void assertCanManageSession(ClassSchedule schedule, JwtPrincipal principal) {
        if (isAdmin(principal)) {
            return;
        }
        if (schedule.getLecturerUser() != null
                && schedule.getLecturerUser().getId().equals(principal.userId())) {
            return;
        }
        throw new AccessDeniedException("Chỉ giảng viên được phân công ca này hoặc quản trị viên mới được điểm danh.");
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeachingCourseClassResponse> listTeachingCourseClasses(UUID lecturerUserId) {
        List<Long> ids = classScheduleRepository.findDistinctCourseClassIdsByLecturerUserId(lecturerUserId);
        if (ids.isEmpty()) {
            return List.of();
        }
        List<CourseClass> classes = courseClassRepository.findAllById(ids);
        classes.sort((a, b) -> {
            String ca = a.getCourse() != null ? a.getCourse().getCourseCode() : "";
            String cb = b.getCourse() != null ? b.getCourse().getCourseCode() : "";
            int c = ca.compareToIgnoreCase(cb);
            if (c != 0) {
                return c;
            }
            return a.getSectionCode().compareToIgnoreCase(b.getSectionCode());
        });
        List<TeachingCourseClassResponse> out = new ArrayList<>();
        for (CourseClass cc : classes) {
            out.add(toTeaching(cc));
        }
        return out;
    }

    private static TeachingCourseClassResponse toTeaching(CourseClass cc) {
        TeachingCourseClassResponse r = new TeachingCourseClassResponse();
        r.setId(cc.getId());
        r.setSectionCode(cc.getSectionCode());
        r.setClassName(cc.getClassName());
        r.setAcademicYear(cc.getAcademicYear());
        r.setSemester(cc.getSemester());
        if (cc.getCourse() != null) {
            r.setCourseCode(cc.getCourse().getCourseCode());
            r.setCourseName(cc.getCourse().getCourseName());
        }
        return r;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceSlotResponse> listAttendanceSlots(
            Long courseClassId, LocalDate fromInclusive, LocalDate toInclusive, JwtPrincipal principal) {
        assertCanListSlots(courseClassId, principal);
        LocalDate from = fromInclusive != null ? fromInclusive : LocalDate.now().minusWeeks(4);
        LocalDate to = toInclusive != null ? toInclusive : LocalDate.now().plusWeeks(12);
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("Khoảng ngày không hợp lệ (từ ngày phải trước hoặc bằng đến ngày).");
        }
        List<ClassSchedule> schedules =
                isAdmin(principal)
                        ? classScheduleRepository.findWithDetailsByCourseClassId(courseClassId)
                        : classScheduleRepository.findWithDetailsByCourseClassIdAndLecturerUserId(
                                courseClassId, principal.userId());
        List<AttendanceSlotResponse> slots = new ArrayList<>();
        for (ClassSchedule cs : schedules) {
            expandOccurrences(cs, from, to, slots);
        }
        slots.sort(
                Comparator.comparing(AttendanceSlotResponse::getSessionDate)
                        .thenComparing(AttendanceSlotResponse::getStartPeriod)
                        .thenComparing(AttendanceSlotResponse::getClassScheduleId));
        return slots;
    }

    private void expandOccurrences(ClassSchedule cs, LocalDate from, LocalDate to, List<AttendanceSlotResponse> out) {
        LocalDate rangeStart = maxDate(from, cs.getStartDate());
        LocalDate rangeEnd = minDate(to, cs.getEndDate());
        if (rangeStart.isAfter(rangeEnd)) {
            return;
        }
        int targetDow = cs.getDayOfWeek();
        for (LocalDate d = rangeStart; !d.isAfter(rangeEnd); d = d.plusDays(1)) {
            if (vietnameseDayOfWeek(d) == targetDow) {
                out.add(toSlotResponse(cs, d));
            }
        }
    }

    private static LocalDate maxDate(LocalDate a, LocalDate b) {
        return a.isAfter(b) ? a : b;
    }

    private static LocalDate minDate(LocalDate a, LocalDate b) {
        return a.isBefore(b) ? a : b;
    }

    private AttendanceSlotResponse toSlotResponse(ClassSchedule cs, LocalDate sessionDate) {
        AttendanceSlotResponse r = new AttendanceSlotResponse();
        r.setClassScheduleId(cs.getId());
        r.setSessionDate(sessionDate);
        r.setDayOfWeek(cs.getDayOfWeek());
        r.setStartPeriod(cs.getStartPeriod());
        r.setEndPeriod(cs.getEndPeriod());
        Classroom room = cs.getClassroom();
        if (room != null) {
            r.setRoomCode(room.getRoomCode());
            r.setRoomName(room.getRoomName());
        }
        User lec = cs.getLecturerUser();
        if (lec != null) {
            r.setLecturerUserId(lec.getId());
            r.setLecturerFullName(lec.getFullName() != null ? lec.getFullName() : lec.getUsername());
        }
        r.setLabel(buildSlotLabel(sessionDate, cs));
        return r;
    }

    static String buildSlotLabel(LocalDate sessionDate, ClassSchedule cs) {
        String day = vietnameseDayLabel(cs.getDayOfWeek());
        String room = "";
        if (cs.getClassroom() != null && cs.getClassroom().getRoomCode() != null) {
            room = " · " + cs.getClassroom().getRoomCode();
        }
        return sessionDate + " · " + day + " · Tiết " + cs.getStartPeriod() + "-" + cs.getEndPeriod() + room;
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceSessionResponse getSession(
            Long courseClassId, Long classScheduleId, LocalDate sessionDate, JwtPrincipal principal) {
        ClassSchedule schedule = resolveScheduleForSession(courseClassId, classScheduleId, sessionDate);
        assertCanManageSession(schedule, principal);
        CourseClass cc = courseClassRepository
                .findById(courseClassId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
        return buildSessionResponse(cc, schedule, sessionDate);
    }

    private AttendanceSessionResponse buildSessionResponse(CourseClass cc, ClassSchedule schedule, LocalDate sessionDate) {
        List<CourseClassEnrollment> enrollments = enrollmentRepository.findWithDetailsByCourseClassId(cc.getId());
        List<ClassAttendance> existing =
                classAttendanceRepository.findForSessionWithEnrollment(cc.getId(), sessionDate, schedule.getId());
        Map<Long, ClassAttendance> byEnrollment =
                existing.stream().collect(Collectors.toMap(a -> a.getEnrollment().getId(), a -> a));

        List<AttendanceSessionStudentRowResponse> rows = new ArrayList<>();
        for (CourseClassEnrollment e : enrollments) {
            AttendanceSessionStudentRowResponse row = new AttendanceSessionStudentRowResponse();
            row.setEnrollmentId(e.getId());
            row.setUserId(e.getUser().getId());
            row.setUsername(e.getUser().getUsername());
            row.setFullName(e.getUser().getFullName());
            ClassAttendance att = byEnrollment.get(e.getId());
            row.setStatus(att != null ? att.getStatus().name() : null);
            rows.add(row);
        }

        AttendanceSessionResponse resp = new AttendanceSessionResponse();
        resp.setCourseClassId(cc.getId());
        resp.setClassScheduleId(schedule.getId());
        resp.setSessionDate(sessionDate);
        resp.setDayOfWeek(schedule.getDayOfWeek());
        resp.setStartPeriod(schedule.getStartPeriod());
        resp.setEndPeriod(schedule.getEndPeriod());
        if (schedule.getClassroom() != null) {
            resp.setRoomCode(schedule.getClassroom().getRoomCode());
            resp.setRoomName(schedule.getClassroom().getRoomName());
        }
        if (schedule.getLecturerUser() != null) {
            resp.setLecturerFullName(
                    schedule.getLecturerUser().getFullName() != null
                            ? schedule.getLecturerUser().getFullName()
                            : schedule.getLecturerUser().getUsername());
        }
        resp.setSlotLabel(buildSlotLabel(sessionDate, schedule));
        resp.setSectionCode(cc.getSectionCode());
        if (cc.getCourse() != null) {
            resp.setCourseCode(cc.getCourse().getCourseCode());
            resp.setCourseName(cc.getCourse().getCourseName());
        }
        resp.setStudents(rows);
        return resp;
    }

    @Override
    @Transactional
    public AttendanceSessionResponse upsertSession(
            Long courseClassId,
            Long classScheduleId,
            LocalDate sessionDate,
            AttendanceSessionUpsertRequest request,
            JwtPrincipal principal) {
        ClassSchedule schedule = resolveScheduleForSession(courseClassId, classScheduleId, sessionDate);
        assertCanManageSession(schedule, principal);
        CourseClass cc = courseClassRepository
                .findById(courseClassId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));

        List<CourseClassEnrollment> enrollments = enrollmentRepository.findWithDetailsByCourseClassId(courseClassId);
        Map<Long, CourseClassEnrollment> enrollmentById =
                enrollments.stream().collect(Collectors.toMap(CourseClassEnrollment::getId, e -> e));

        User recorder = userRepository.getReferenceById(principal.userId());

        for (AttendanceSessionUpsertItem item : request.getItems()) {
            CourseClassEnrollment en = enrollmentById.get(item.getEnrollmentId());
            if (en == null) {
                throw new IllegalArgumentException("Đăng ký không thuộc lớp: " + item.getEnrollmentId());
            }
            AttendanceStatus st = parseStatus(item.getStatus());
            ClassAttendance row = classAttendanceRepository
                    .findByEnrollment_IdAndSessionDateAndClassSchedule_Id(en.getId(), sessionDate, schedule.getId())
                    .orElseGet(ClassAttendance::new);
            row.setEnrollment(en);
            row.setClassSchedule(schedule);
            row.setSessionDate(sessionDate);
            row.setStatus(st);
            row.setRecordedByUser(recorder);
            classAttendanceRepository.save(row);
        }

        return buildSessionResponse(cc, schedule, sessionDate);
    }

    @Override
    @Transactional(readOnly = true)
    public ByteArrayInputStream exportSessionExcel(
            Long courseClassId, Long classScheduleId, LocalDate sessionDate, JwtPrincipal principal) {
        AttendanceSessionResponse session = getSession(courseClassId, classScheduleId, sessionDate, principal);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Attendance");
            int r = 0;
            Row meta1 = sheet.createRow(r++);
            meta1.createCell(0).setCellValue("courseClassId");
            meta1.createCell(1).setCellValue(session.getCourseClassId());
            Row meta2 = sheet.createRow(r++);
            meta2.createCell(0).setCellValue("classScheduleId");
            meta2.createCell(1).setCellValue(session.getClassScheduleId());
            Row meta3 = sheet.createRow(r++);
            meta3.createCell(0).setCellValue("sessionDate");
            meta3.createCell(1).setCellValue(session.getSessionDate().toString());
            Row meta4 = sheet.createRow(r++);
            meta4.createCell(0).setCellValue("slotLabel");
            meta4.createCell(1).setCellValue(session.getSlotLabel() != null ? session.getSlotLabel() : "");
            r++;
            Row header = sheet.createRow(r++);
            header.createCell(0).setCellValue("enrollmentId");
            header.createCell(1).setCellValue("userId");
            header.createCell(2).setCellValue("username");
            header.createCell(3).setCellValue("fullName");
            header.createCell(4).setCellValue("status");
            for (AttendanceSessionStudentRowResponse row : session.getStudents()) {
                Row x = sheet.createRow(r++);
                x.createCell(0).setCellValue(row.getEnrollmentId());
                x.createCell(1).setCellValue(row.getUserId() != null ? row.getUserId().toString() : "");
                x.createCell(2).setCellValue(row.getUsername() != null ? row.getUsername() : "");
                x.createCell(3).setCellValue(row.getFullName() != null ? row.getFullName() : "");
                x.createCell(4).setCellValue(row.getStatus() != null ? row.getStatus() : "");
            }
            for (int c = 0; c < 5; c++) {
                sheet.autoSizeColumn(c);
            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (IOException e) {
            throw new IllegalArgumentException("Không thể xuất Excel: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public AttendanceSessionResponse importSessionExcel(
            Long courseClassId,
            Long classScheduleId,
            LocalDate sessionDate,
            MultipartFile file,
            JwtPrincipal principal) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File import rỗng.");
        }
        ClassSchedule schedule = resolveScheduleForSession(courseClassId, classScheduleId, sessionDate);
        assertCanManageSession(schedule, principal);
        courseClassRepository
                .findById(courseClassId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
        List<CourseClassEnrollment> enrollments = enrollmentRepository.findWithDetailsByCourseClassId(courseClassId);
        Map<Long, CourseClassEnrollment> enrollmentById =
                enrollments.stream().collect(Collectors.toMap(CourseClassEnrollment::getId, e -> e));
        Map<UUID, CourseClassEnrollment> enrollmentByUserId =
                enrollments.stream().collect(Collectors.toMap(e -> e.getUser().getId(), e -> e, (a, b) -> a));

        List<AttendanceSessionUpsertItem> items = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                throw new IllegalArgumentException("Không có sheet dữ liệu.");
            }
            int headerRowIdx = findAttendanceImportHeaderRow(sheet);
            if (headerRowIdx < 0) {
                throw new IllegalArgumentException("Không tìm thấy dòng tiêu đề (enrollmentId, status).");
            }
            int colEnrollment = 0;
            int colUserId = 1;
            int colStatus = 4;
            for (int i = headerRowIdx + 1; i <= sheet.getLastRowNum(); i++) {
                final int rowNumber = i + 1;
                Row row = sheet.getRow(i);
                if (row == null) {
                    continue;
                }
                String statusRaw = cellString(row.getCell(colStatus));
                if (statusRaw.isEmpty()) {
                    continue;
                }
                Long enrollmentId = parseLongFlexible(cellString(row.getCell(colEnrollment)));
                CourseClassEnrollment en = null;
                if (enrollmentId != null) {
                    en = enrollmentById.get(enrollmentId);
                }
                if (en == null) {
                    String userIdRaw = cellString(row.getCell(colUserId)).trim();
                    if (!userIdRaw.isEmpty()) {
                        try {
                            UUID uid = UUID.fromString(userIdRaw);
                            en = enrollmentByUserId.get(uid);
                        } catch (Exception ex) {
                            throw new IllegalArgumentException("userId không hợp lệ tại dòng " + rowNumber);
                        }
                    }
                }
                if (en == null) {
                    throw new IllegalArgumentException("Không xác định được đăng ký (enrollmentId/userId) tại dòng " + rowNumber);
                }
                AttendanceSessionUpsertItem item = new AttendanceSessionUpsertItem();
                item.setEnrollmentId(en.getId());
                item.setStatus(statusRaw);
                items.add(item);
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Không đọc được file Excel: " + e.getMessage());
        }
        if (items.isEmpty()) {
            throw new IllegalArgumentException("Không có dòng dữ liệu hợp lệ (cần cột status khác trống).");
        }
        AttendanceSessionUpsertRequest req = new AttendanceSessionUpsertRequest();
        req.setItems(items);
        return upsertSession(courseClassId, classScheduleId, sessionDate, req, principal);
    }

    /** Tìm dòng có tiêu đề enrollmentId (không phân biệt hoa thường). */
    private static int findAttendanceImportHeaderRow(Sheet sheet) {
        for (int i = 0; i <= Math.min(sheet.getLastRowNum(), 30); i++) {
            Row row = sheet.getRow(i);
            if (row == null) {
                continue;
            }
            String a = cellString(row.getCell(0)).trim();
            if (a.equalsIgnoreCase("enrollmentId")) {
                return i;
            }
        }
        return -1;
    }

    private static Long parseLongFlexible(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String t = raw.trim();
        int dot = t.indexOf('.');
        if (dot > 0) {
            t = t.substring(0, dot);
        }
        try {
            return Long.parseLong(t);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static String cellString(Cell cell) {
        if (cell == null) {
            return "";
        }
        return CELL_FORMATTER.formatCellValue(cell).trim();
    }

    private static AttendanceStatus parseStatus(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Trạng thái điểm danh không được để trống.");
        }
        try {
            return AttendanceStatus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + raw);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<MyAttendanceDayResponse> listMyAttendanceInClass(
            Long courseClassId, UUID studentUserId, LocalDate fromInclusive, LocalDate toInclusive) {
        enrollmentRepository
                .findByCourseClass_IdAndUser_Id(courseClassId, studentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Bạn chưa đăng ký lớp học phần này."));
        LocalDate from = fromInclusive != null ? fromInclusive : LocalDate.of(1970, 1, 1);
        LocalDate to = toInclusive != null ? toInclusive : LocalDate.of(2999, 12, 31);
        List<ClassAttendance> list =
                classAttendanceRepository.findForStudentClassBetween(studentUserId, courseClassId, from, to);
        List<MyAttendanceDayResponse> out = new ArrayList<>();
        for (ClassAttendance a : list) {
            MyAttendanceDayResponse d = new MyAttendanceDayResponse();
            d.setSessionDate(a.getSessionDate());
            d.setStatus(a.getStatus().name());
            ClassSchedule cs = a.getClassSchedule();
            d.setClassScheduleId(cs.getId());
            d.setDayOfWeek(cs.getDayOfWeek());
            d.setStartPeriod(cs.getStartPeriod());
            d.setEndPeriod(cs.getEndPeriod());
            if (cs.getClassroom() != null) {
                d.setRoomCode(cs.getClassroom().getRoomCode());
                d.setRoomName(cs.getClassroom().getRoomName());
            }
            if (cs.getLecturerUser() != null) {
                d.setLecturerFullName(
                        cs.getLecturerUser().getFullName() != null
                                ? cs.getLecturerUser().getFullName()
                                : cs.getLecturerUser().getUsername());
            }
            d.setSlotLabel(buildSlotLabel(a.getSessionDate(), cs));
            out.add(d);
        }
        return out;
    }
}
