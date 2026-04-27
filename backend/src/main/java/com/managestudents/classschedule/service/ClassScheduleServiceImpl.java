package com.managestudents.classschedule.service;

import com.managestudents.classroom.entity.Classroom;
import com.managestudents.classroom.repository.ClassroomRepository;
import com.managestudents.classschedule.dto.ClassScheduleCreateRequest;
import com.managestudents.classschedule.dto.ClassScheduleMoveRequest;
import com.managestudents.classschedule.dto.ClassScheduleResponse;
import com.managestudents.classschedule.dto.ClassScheduleUpdateRequest;
import com.managestudents.classschedule.entity.ClassSchedule;
import com.managestudents.classschedule.repository.ClassScheduleRepository;
import com.managestudents.classschedule.repository.ClassScheduleSpecifications;
import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.courseclass.entity.CourseClass;
import com.managestudents.courseclass.repository.CourseClassRepository;
import com.managestudents.user.entity.User;
import com.managestudents.user.entity.UserRole;
import com.managestudents.user.repository.UserRepository;
import com.managestudents.user.repository.UserRoleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ClassScheduleServiceImpl implements ClassScheduleService {

    private final ClassScheduleRepository classScheduleRepository;
    private final CourseClassRepository courseClassRepository;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    public ClassScheduleServiceImpl(
            ClassScheduleRepository classScheduleRepository,
            CourseClassRepository courseClassRepository,
            ClassroomRepository classroomRepository,
            UserRepository userRepository,
            UserRoleRepository userRoleRepository) {
        this.classScheduleRepository = classScheduleRepository;
        this.courseClassRepository = courseClassRepository;
        this.classroomRepository = classroomRepository;
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ClassScheduleResponse> findAll(String keyword, Long courseClassId, Long classroomId, Pageable pageable) {
        Specification<ClassSchedule> spec = ClassScheduleSpecifications.hasCourseClassId(courseClassId)
                .and(ClassScheduleSpecifications.hasClassroomId(classroomId));
        if (keyword != null && !keyword.isBlank()) {
            spec = spec.and(ClassScheduleSpecifications.matchesKeyword(keyword));
        }
        return classScheduleRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ClassScheduleResponse findById(Long id) {
        ClassSchedule entity = classScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch học"));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public ClassScheduleResponse create(ClassScheduleCreateRequest request) {
        CourseClass courseClass = findCourseClass(request.getCourseClassId());
        java.time.LocalDate computedEndDate = computeEndDateByCredits(courseClass, request.getStartDate());
        validateRange(request.getStartPeriod(), request.getEndPeriod(), request.getStartDate(), computedEndDate);
        Classroom classroom = findClassroom(request.getClassroomId());
        User lecturerUser = findTeacherUser(request.getLecturerUserId());
        validateNoConflict(
                null,
                request.getDayOfWeek(),
                request.getStartPeriod(),
                request.getEndPeriod(),
                request.getStartDate(),
                computedEndDate,
                classroom.getId(),
                lecturerUser.getId());

        ClassSchedule entity = new ClassSchedule();
        apply(entity, request, courseClass, classroom, lecturerUser, computedEndDate);
        return toResponse(classScheduleRepository.save(entity));
    }

    @Override
    @Transactional
    public ClassScheduleResponse update(Long id, ClassScheduleUpdateRequest request) {
        ClassSchedule entity = classScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch học"));
        CourseClass courseClass = findCourseClass(request.getCourseClassId());
        java.time.LocalDate computedEndDate = computeEndDateByCredits(courseClass, request.getStartDate());
        validateRange(request.getStartPeriod(), request.getEndPeriod(), request.getStartDate(), computedEndDate);
        Classroom classroom = findClassroom(request.getClassroomId());
        User lecturerUser = findTeacherUser(request.getLecturerUserId());
        validateNoConflict(
                id,
                request.getDayOfWeek(),
                request.getStartPeriod(),
                request.getEndPeriod(),
                request.getStartDate(),
                computedEndDate,
                classroom.getId(),
                lecturerUser.getId());

        apply(entity, request, courseClass, classroom, lecturerUser, computedEndDate);
        return toResponse(classScheduleRepository.save(entity));
    }

    @Override
    @Transactional
    public ClassScheduleResponse move(Long id, ClassScheduleMoveRequest request) {
        ClassSchedule moving = classScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch học"));

        Shift targetShift = shiftByCode(request.getShiftCode());
        LocalDate targetDate = request.getTargetDate();
        int sourceDayIndex = moving.getDayOfWeek() == 8 ? 6 : moving.getDayOfWeek() - 2;
        int targetDayIndex = request.getDayOfWeek() == 8 ? 6 : request.getDayOfWeek() - 2;
        LocalDate sourceDate = targetDate.plusDays(sourceDayIndex - targetDayIndex);

        if (sourceDate.isBefore(moving.getStartDate()) || sourceDate.isAfter(moving.getEndDate())) {
            throw new IllegalArgumentException("Không tìm thấy buổi học nguồn để đổi trong tuần đã chọn");
        }

        validateNoConflict(
                null,
                request.getDayOfWeek(),
                targetShift.startPeriod(),
                targetShift.endPeriod(),
                targetDate,
                targetDate,
                moving.getClassroom().getId(),
                moving.getLecturerUser().getId());

        if (sourceDate.equals(targetDate)
                && moving.getDayOfWeek().equals(request.getDayOfWeek())
                && moving.getStartPeriod().equals(targetShift.startPeriod())
                && moving.getEndPeriod().equals(targetShift.endPeriod())) {
            return toResponse(moving);
        }

        LocalDate beforeEnd = sourceDate.minusWeeks(1);
        LocalDate afterStart = sourceDate.plusWeeks(1);

        if (beforeEnd.isBefore(moving.getStartDate()) && afterStart.isAfter(moving.getEndDate())) {
            classScheduleRepository.delete(moving);
        } else if (beforeEnd.isBefore(moving.getStartDate())) {
            moving.setStartDate(afterStart);
            classScheduleRepository.save(moving);
        } else if (afterStart.isAfter(moving.getEndDate())) {
            moving.setEndDate(beforeEnd);
            classScheduleRepository.save(moving);
        } else {
            ClassSchedule tail = cloneSchedule(moving);
            tail.setStartDate(afterStart);
            tail.setEndDate(moving.getEndDate());
            moving.setEndDate(beforeEnd);
            classScheduleRepository.save(moving);
            classScheduleRepository.save(tail);
        }

        ClassSchedule oneOff = cloneSchedule(moving);
        oneOff.setDayOfWeek(request.getDayOfWeek());
        oneOff.setStartPeriod(targetShift.startPeriod());
        oneOff.setEndPeriod(targetShift.endPeriod());
        oneOff.setStartDate(targetDate);
        oneOff.setEndDate(targetDate);
        ClassSchedule saved = classScheduleRepository.save(oneOff);

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!classScheduleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy lịch học");
        }
        classScheduleRepository.deleteById(id);
    }

    private static void validateRange(Integer startPeriod, Integer endPeriod, java.time.LocalDate startDate, java.time.LocalDate endDate) {
        if (startPeriod != null && endPeriod != null && endPeriod < startPeriod) {
            throw new IllegalArgumentException("Tiết kết thúc phải lớn hơn hoặc bằng tiết bắt đầu");
        }
        if (startPeriod != null && endPeriod != null && sessionOf(startPeriod) != sessionOf(endPeriod)) {
            throw new IllegalArgumentException("Tiết bắt đầu và tiết kết thúc phải cùng buổi");
        }
        if (startPeriod != null && endPeriod != null && !isSingleShift(startPeriod, endPeriod)) {
            throw new IllegalArgumentException("Mỗi môn chỉ được học trong đúng 1 ca");
        }
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
        }
    }

    private static int sessionOf(int period) {
        if (period >= 1 && period <= 6) return 1;
        if (period >= 7 && period <= 12) return 2;
        if (period >= 13 && period <= 15) return 3;
        throw new IllegalArgumentException("Tiết học hợp lệ từ 1 đến 15");
    }

    private static boolean dateRangesOverlap(LocalDate aStart, LocalDate aEnd, LocalDate bStart, LocalDate bEnd) {
        return !(aEnd.isBefore(bStart) || bEnd.isBefore(aStart));
    }

    private void validateNoConflict(
            Long currentId,
            Integer dayOfWeek,
            Integer startPeriod,
            Integer endPeriod,
            LocalDate startDate,
            LocalDate endDate,
            Long classroomId,
            java.util.UUID lecturerUserId) {
        List<ClassSchedule> sameDay = currentId == null
                ? classScheduleRepository.findByDayOfWeek(dayOfWeek)
                : classScheduleRepository.findByDayOfWeekAndIdNot(dayOfWeek, currentId);
        for (ClassSchedule other : sameDay) {
            if (!dateRangesOverlap(startDate, endDate, other.getStartDate(), other.getEndDate())) {
                continue;
            }
            if (other.getStartPeriod().equals(startPeriod) && other.getEndPeriod().equals(endPeriod)) {
                if (other.getClassroom() != null && other.getClassroom().getId().equals(classroomId)) {
                    throw new IllegalArgumentException("Phòng học đã có lớp ở ca này");
                }
                if (other.getLecturerUser() != null && other.getLecturerUser().getId().equals(lecturerUserId)) {
                    throw new IllegalArgumentException("Giảng viên đã có lớp ở ca này");
                }
            }
        }
    }

    private static boolean isSingleShift(int startPeriod, int endPeriod) {
        return (startPeriod == 1 && endPeriod == 3)
                || (startPeriod == 4 && endPeriod == 6)
                || (startPeriod == 7 && endPeriod == 9)
                || (startPeriod == 10 && endPeriod == 12)
                || (startPeriod == 13 && endPeriod == 15);
    }

    private static Shift shiftByCode(String code) {
        return switch (code) {
            case "M1" -> new Shift(1, 3);
            case "M2" -> new Shift(4, 6);
            case "A1" -> new Shift(7, 9);
            case "A2" -> new Shift(10, 12);
            case "E1" -> new Shift(13, 15);
            default -> throw new IllegalArgumentException("Ca học không hợp lệ");
        };
    }

    private static ClassSchedule cloneSchedule(ClassSchedule source) {
        ClassSchedule cloned = new ClassSchedule();
        cloned.setCourseClass(source.getCourseClass());
        cloned.setClassroom(source.getClassroom());
        cloned.setDayOfWeek(source.getDayOfWeek());
        cloned.setStartPeriod(source.getStartPeriod());
        cloned.setEndPeriod(source.getEndPeriod());
        cloned.setStartDate(source.getStartDate());
        cloned.setEndDate(source.getEndDate());
        cloned.setLecturerUser(source.getLecturerUser());
        cloned.setLecturerFullName(source.getLecturerFullName());
        cloned.setDescription(source.getDescription());
        return cloned;
    }

    private record Shift(int startPeriod, int endPeriod) {
    }

    private CourseClass findCourseClass(Long id) {
        return courseClassRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
    }

    private Classroom findClassroom(Long id) {
        return classroomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng học"));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private static java.time.LocalDate computeEndDateByCredits(CourseClass courseClass, java.time.LocalDate startDate) {
        if (startDate == null) {
            throw new IllegalArgumentException("Ngày bắt đầu không được để trống");
        }
        Integer credits = courseClass.getCourse() != null ? courseClass.getCourse().getCredits() : null;
        int weeks = weeksByCredits(credits);
        return startDate.plusWeeks(weeks - 1L);
    }

    private static int weeksByCredits(Integer credits) {
        if (credits == null) {
            throw new IllegalArgumentException("Học phần chưa có số tín chỉ");
        }
        return switch (credits) {
            case 2 -> 10;
            case 3 -> 15;
            case 5 -> 5;
            default -> 15;
        };
    }

    private User findTeacherUser(java.util.UUID userId) {
        User user = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản giảng viên"));
        java.util.List<UserRole> links = userRoleRepository.findAllFetchRoleByUserIdIn(java.util.List.of(userId));
        boolean isTeacher = links.stream().anyMatch(link -> {
            String roleCode = link.getRole() != null && link.getRole().getRoleCode() != null
                    ? link.getRole().getRoleCode().trim()
                    : "";
            if (roleCode.equalsIgnoreCase("TEACHER")
                    || roleCode.equalsIgnoreCase("GIANG_VIEN")
                    || roleCode.equalsIgnoreCase("LECTURER")) {
                return true;
            }
            String roleName = link.getRole() != null && link.getRole().getRoleName() != null
                    ? link.getRole().getRoleName().trim().toLowerCase()
                    : "";
            return roleName.contains("giang vien") || roleName.contains("teacher") || roleName.contains("lecturer");
        });
        if (!isTeacher) {
            throw new IllegalArgumentException("Tài khoản được chọn không có role Teacher/Giảng viên");
        }
        return user;
    }

    private static void apply(
            ClassSchedule entity,
            ClassScheduleCreateRequest request,
            CourseClass courseClass,
            Classroom classroom,
            User lecturerUser,
            java.time.LocalDate computedEndDate) {
        entity.setCourseClass(courseClass);
        entity.setClassroom(classroom);
        entity.setLecturerUser(lecturerUser);
        entity.setLecturerFullName(lecturerUser.getFullName());
        entity.setDayOfWeek(request.getDayOfWeek());
        entity.setStartPeriod(request.getStartPeriod());
        entity.setEndPeriod(request.getEndPeriod());
        entity.setStartDate(request.getStartDate());
        entity.setEndDate(computedEndDate);
        entity.setDescription(trimToNull(request.getDescription()));
    }

    private ClassScheduleResponse toResponse(ClassSchedule entity) {
        ClassScheduleResponse dto = new ClassScheduleResponse();
        dto.setId(entity.getId());
        dto.setCourseClassId(entity.getCourseClass().getId());
        dto.setCourseCode(entity.getCourseClass().getCourse().getCourseCode());
        dto.setCourseName(entity.getCourseClass().getCourse().getCourseName());
        dto.setSectionCode(entity.getCourseClass().getSectionCode());
        dto.setClassName(entity.getCourseClass().getClassName());
        dto.setClassroomId(entity.getClassroom().getId());
        dto.setRoomCode(entity.getClassroom().getRoomCode());
        dto.setRoomName(entity.getClassroom().getRoomName());
        dto.setDayOfWeek(entity.getDayOfWeek());
        dto.setStartPeriod(entity.getStartPeriod());
        dto.setEndPeriod(entity.getEndPeriod());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setLecturerUserId(entity.getLecturerUser().getId());
        dto.setLecturerUsername(entity.getLecturerUser().getUsername());
        dto.setLecturerFullName(entity.getLecturerUser().getFullName());
        dto.setDescription(entity.getDescription());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
