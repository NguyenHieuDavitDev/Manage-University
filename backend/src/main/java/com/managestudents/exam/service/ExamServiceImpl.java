package com.managestudents.exam.service;

import com.managestudents.classroom.entity.Classroom;
import com.managestudents.classroom.repository.ClassroomRepository;
import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.courseclass.entity.CourseClass;
import com.managestudents.courseclass.repository.CourseClassEnrollmentRepository;
import com.managestudents.courseclass.repository.CourseClassRepository;
import com.managestudents.exam.dto.ExamAutoScheduleRequest;
import com.managestudents.exam.dto.ExamCreateRequest;
import com.managestudents.exam.dto.ExamResponse;
import com.managestudents.exam.dto.ExamUpdateRequest;
import com.managestudents.exam.entity.Exam;
import com.managestudents.exam.repository.ExamRepository;
import com.managestudents.exam.repository.ExamSpecifications;
import com.managestudents.examtype.entity.ExamType;
import com.managestudents.examtype.repository.ExamTypeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ExamServiceImpl implements ExamService {
    private static final int[][] SHIFTS = new int[][]{{1,3},{4,6},{7,9},{10,12},{13,15}};

    private final ExamRepository examRepository;
    private final CourseClassRepository courseClassRepository;
    private final ExamTypeRepository examTypeRepository;
    private final ClassroomRepository classroomRepository;
    private final CourseClassEnrollmentRepository enrollmentRepository;

    public ExamServiceImpl(
            ExamRepository examRepository,
            CourseClassRepository courseClassRepository,
            ExamTypeRepository examTypeRepository,
            ClassroomRepository classroomRepository,
            CourseClassEnrollmentRepository enrollmentRepository) {
        this.examRepository = examRepository;
        this.courseClassRepository = courseClassRepository;
        this.examTypeRepository = examTypeRepository;
        this.classroomRepository = classroomRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ExamResponse> findAll(String keyword, Long courseClassId, Long examTypeId, Pageable pageable) {
        Specification<Exam> spec = ExamSpecifications.hasCourseClassId(courseClassId)
                .and(ExamSpecifications.hasExamTypeId(examTypeId));
        if (keyword != null && !keyword.isBlank()) spec = spec.and(ExamSpecifications.matchesKeyword(keyword));
        return examRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ExamResponse findById(Long id) {
        return toResponse(findExam(id));
    }

    @Override
    @Transactional
    public ExamResponse create(ExamCreateRequest request) {
        CourseClass cc = findCourseClass(request.getCourseClassId());
        ExamType et = findExamType(request.getExamTypeId());
        Classroom room = findClassroom(request.getClassroomId());
        validatePeriods(request.getStartPeriod(), request.getEndPeriod());
        validateNoConflict(null, request.getExamDate(), request.getStartPeriod(), request.getEndPeriod(), room.getId());
        Exam e = new Exam();
        apply(e, request, cc, et, room);
        return toResponse(examRepository.save(e));
    }

    @Override
    @Transactional
    public ExamResponse update(Long id, ExamUpdateRequest request) {
        Exam e = findExam(id);
        CourseClass cc = findCourseClass(request.getCourseClassId());
        ExamType et = findExamType(request.getExamTypeId());
        Classroom room = findClassroom(request.getClassroomId());
        validatePeriods(request.getStartPeriod(), request.getEndPeriod());
        validateNoConflict(id, request.getExamDate(), request.getStartPeriod(), request.getEndPeriod(), room.getId());
        apply(e, request, cc, et, room);
        return toResponse(examRepository.save(e));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!examRepository.existsById(id)) throw new ResourceNotFoundException("Không tìm thấy lịch thi");
        examRepository.deleteById(id);
    }

    @Override
    @Transactional
    public List<ExamResponse> autoSchedule(ExamAutoScheduleRequest request) {
        if (request.getToDate().isBefore(request.getFromDate())) {
            throw new IllegalArgumentException("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
        }
        ExamType examType = findExamType(request.getExamTypeId());
        List<Classroom> rooms = (request.getClassroomIds() == null || request.getClassroomIds().isEmpty())
                ? classroomRepository.findAll()
                : classroomRepository.findAllById(request.getClassroomIds());
        if (rooms.isEmpty()) throw new IllegalArgumentException("Không có phòng để phân lịch thi.");
        rooms = rooms.stream().sorted(Comparator.comparing(Classroom::getCapacity, Comparator.nullsLast(Comparator.reverseOrder()))).toList();

        List<CourseClass> candidates = courseClassRepository.findAll().stream()
                .filter(cc -> !examRepository.existsByCourseClass_IdAndExamType_Id(cc.getId(), examType.getId()))
                .toList();
        List<Exam> existing = examRepository.findByExamDateBetween(request.getFromDate(), request.getToDate());
        Set<String> occupied = existing.stream()
                .map(e -> slotKey(e.getExamDate(), e.getStartPeriod(), e.getEndPeriod(), e.getClassroom().getId()))
                .collect(Collectors.toSet());
        Map<Long, Long> enrollCounts = candidates.stream()
                .collect(Collectors.toMap(CourseClass::getId, cc -> enrollmentRepository.countByCourseClass_Id(cc.getId())));
        List<CourseClass> sorted = candidates.stream()
                .sorted(Comparator.comparing((CourseClass cc) -> enrollCounts.getOrDefault(cc.getId(), 0L)).reversed())
                .toList();

        List<Exam> created = new ArrayList<>();
        for (CourseClass cc : sorted) {
            long studentCount = enrollCounts.getOrDefault(cc.getId(), 0L);
            boolean placed = false;
            LocalDate d = request.getFromDate();
            while (!d.isAfter(request.getToDate()) && !placed) {
                if (d.getDayOfWeek() == DayOfWeek.SATURDAY || d.getDayOfWeek() == DayOfWeek.SUNDAY) {
                    d = d.plusDays(1);
                    continue;
                }
                for (int[] shift : SHIFTS) {
                    for (Classroom room : rooms) {
                        Integer cap = room.getCapacity();
                        if (cap != null && cap > 0 && studentCount > cap) continue;
                        String key = slotKey(d, shift[0], shift[1], room.getId());
                        if (occupied.contains(key)) continue;
                        Exam e = new Exam();
                        e.setCourseClass(cc);
                        e.setExamType(examType);
                        e.setClassroom(room);
                        e.setExamDate(d);
                        e.setStartPeriod(shift[0]);
                        e.setEndPeriod(shift[1]);
                        e.setDescription("Phân lịch thi tự động");
                        examRepository.save(e);
                        created.add(e);
                        occupied.add(key);
                        placed = true;
                        break;
                    }
                    if (placed) break;
                }
                d = d.plusDays(1);
            }
        }
        return created.stream().map(this::toResponse).toList();
    }

    private void validateNoConflict(Long currentId, LocalDate examDate, Integer startPeriod, Integer endPeriod, Long classroomId) {
        List<Exam> sameDate = examRepository.findByExamDateBetween(examDate, examDate);
        for (Exam e : sameDate) {
            if (currentId != null && currentId.equals(e.getId())) continue;
            if (!e.getClassroom().getId().equals(classroomId)) continue;
            if (e.getStartPeriod().equals(startPeriod) && e.getEndPeriod().equals(endPeriod)) {
                throw new IllegalArgumentException("Phòng đã có lịch thi ở ca này.");
            }
        }
    }

    private static void validatePeriods(Integer startPeriod, Integer endPeriod) {
        if (endPeriod < startPeriod) throw new IllegalArgumentException("Tiết kết thúc phải >= tiết bắt đầu");
    }

    private static String trimToNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }

    private static String slotKey(LocalDate d, int s, int e, Long roomId) {
        return d + "|" + s + "|" + e + "|" + roomId;
    }

    private CourseClass findCourseClass(Long id) {
        return courseClassRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
    }
    private ExamType findExamType(Long id) {
        return examTypeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại kỳ thi"));
    }
    private Classroom findClassroom(Long id) {
        return classroomRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng thi"));
    }
    private Exam findExam(Long id) {
        return examRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch thi"));
    }

    private static void apply(Exam e, ExamCreateRequest req, CourseClass cc, ExamType et, Classroom room) {
        e.setCourseClass(cc);
        e.setExamType(et);
        e.setClassroom(room);
        e.setExamDate(req.getExamDate());
        e.setStartPeriod(req.getStartPeriod());
        e.setEndPeriod(req.getEndPeriod());
        e.setDescription(trimToNull(req.getDescription()));
    }

    private ExamResponse toResponse(Exam e) {
        ExamResponse dto = new ExamResponse();
        dto.setId(e.getId());
        dto.setCourseClassId(e.getCourseClass().getId());
        dto.setCourseCode(e.getCourseClass().getCourse().getCourseCode());
        dto.setCourseName(e.getCourseClass().getCourse().getCourseName());
        dto.setSectionCode(e.getCourseClass().getSectionCode());
        dto.setExamTypeId(e.getExamType().getId());
        dto.setExamTypeCode(e.getExamType().getExamTypeCode());
        dto.setExamTypeName(e.getExamType().getExamTypeName());
        dto.setClassroomId(e.getClassroom().getId());
        dto.setRoomCode(e.getClassroom().getRoomCode());
        dto.setRoomName(e.getClassroom().getRoomName());
        dto.setExamDate(e.getExamDate());
        dto.setStartPeriod(e.getStartPeriod());
        dto.setEndPeriod(e.getEndPeriod());
        dto.setDescription(e.getDescription());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }
}
