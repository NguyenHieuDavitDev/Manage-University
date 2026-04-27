package com.managestudents.studentgrade.service;

import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.courseclass.entity.CourseClass;
import com.managestudents.courseclass.entity.CourseClassEnrollment;
import com.managestudents.courseclass.repository.CourseClassEnrollmentRepository;
import com.managestudents.courseclass.repository.CourseClassRepository;
import com.managestudents.gradecomponent.entity.GradeComponent;
import com.managestudents.gradecomponent.repository.GradeComponentRepository;
import com.managestudents.gradescale.service.GradeScaleService;
import com.managestudents.studentgrade.dto.StudentGradeComponentScoreRequest;
import com.managestudents.studentgrade.dto.StudentGradeUpsertRequest;
import com.managestudents.studentgrade.dto.StudentGradebookComponentResponse;
import com.managestudents.studentgrade.dto.StudentGradebookResponse;
import com.managestudents.studentgrade.dto.StudentGradebookRowResponse;
import com.managestudents.studentgrade.entity.StudentGrade;
import com.managestudents.studentgrade.repository.StudentGradeRepository;
import com.managestudents.user.entity.User;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class StudentGradeServiceImpl implements StudentGradeService {

    private final CourseClassRepository courseClassRepository;
    private final CourseClassEnrollmentRepository enrollmentRepository;
    private final GradeComponentRepository gradeComponentRepository;
    private final StudentGradeRepository studentGradeRepository;
    private final GradeScaleService gradeScaleService;

    public StudentGradeServiceImpl(
            CourseClassRepository courseClassRepository,
            CourseClassEnrollmentRepository enrollmentRepository,
            GradeComponentRepository gradeComponentRepository,
            StudentGradeRepository studentGradeRepository,
            GradeScaleService gradeScaleService) {
        this.courseClassRepository = courseClassRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.gradeComponentRepository = gradeComponentRepository;
        this.studentGradeRepository = studentGradeRepository;
        this.gradeScaleService = gradeScaleService;
    }

    @Override
    @Transactional(readOnly = true)
    public StudentGradebookResponse getGradebook(Long courseClassId) {
        CourseClass cc = courseClassRepository.findById(courseClassId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
        List<GradeComponent> components = gradeComponentRepository.findAllByOrderByIdAsc();
        List<CourseClassEnrollment> enrollments = enrollmentRepository.findByCourseClass_IdOrderByEnrolledAtAsc(courseClassId);
        return buildGradebook(cc, components, enrollments);
    }

    @Override
    @Transactional
    public StudentGradebookResponse upsertStudentScores(Long courseClassId, UUID userId, StudentGradeUpsertRequest request) {
        CourseClass cc = courseClassRepository.findById(courseClassId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
        if (cc.isGradebookFinalized()) {
            throw new IllegalArgumentException("Bảng điểm đã chốt, không thể sửa.");
        }
        List<GradeComponent> components = gradeComponentRepository.findAllByOrderByIdAsc();
        Map<Long, GradeComponent> componentById = components.stream()
                .collect(Collectors.toMap(GradeComponent::getId, Function.identity()));
        CourseClassEnrollment enrollment = enrollmentRepository.findByCourseClass_IdAndUser_Id(courseClassId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Sinh viên chưa đăng ký lớp học phần này"));

        Set<Long> requestedComponentIds = request.getScores().stream()
                .map(StudentGradeComponentScoreRequest::getGradeComponentId)
                .collect(Collectors.toSet());
        if (requestedComponentIds.isEmpty()) {
            throw new IllegalArgumentException("Danh sách điểm không được rỗng");
        }
        for (Long id : requestedComponentIds) {
            if (!componentById.containsKey(id)) {
                throw new IllegalArgumentException("Thành phần điểm không hợp lệ: " + id);
            }
        }

        for (StudentGradeComponentScoreRequest item : request.getScores()) {
            Long componentId = item.getGradeComponentId();
            BigDecimal rawScore = item.getScore();
            StudentGrade existing = studentGradeRepository
                    .findByEnrollment_IdAndGradeComponent_Id(enrollment.getId(), componentId)
                    .orElse(null);
            if (rawScore == null) {
                if (existing != null) {
                    studentGradeRepository.delete(existing);
                }
                continue;
            }
            BigDecimal normalized = rawScore.setScale(2, RoundingMode.HALF_UP);
            if (existing == null) {
                StudentGrade grade = new StudentGrade();
                grade.setEnrollment(enrollment);
                grade.setGradeComponent(componentById.get(componentId));
                grade.setScore(normalized);
                studentGradeRepository.save(grade);
            } else {
                existing.setScore(normalized);
                studentGradeRepository.save(existing);
            }
        }

        List<CourseClassEnrollment> enrollments = enrollmentRepository.findByCourseClass_IdOrderByEnrolledAtAsc(courseClassId);
        return buildGradebook(cc, components, enrollments);
    }

    @Override
    @Transactional
    public StudentGradebookResponse finalizeGradebook(Long courseClassId, boolean finalized) {
        CourseClass cc = courseClassRepository.findById(courseClassId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
        cc.setGradebookFinalized(finalized);
        courseClassRepository.save(cc);
        List<GradeComponent> components = gradeComponentRepository.findAllByOrderByIdAsc();
        List<CourseClassEnrollment> enrollments = enrollmentRepository.findByCourseClass_IdOrderByEnrolledAtAsc(courseClassId);
        return buildGradebook(cc, components, enrollments);
    }

    @Override
    @Transactional(readOnly = true)
    public ByteArrayInputStream exportGradebookExcel(Long courseClassId) {
        StudentGradebookResponse gradebook = getGradebook(courseClassId);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Gradebook");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("userId");
            header.createCell(1).setCellValue("username");
            header.createCell(2).setCellValue("fullName");
            int col = 3;
            for (StudentGradebookComponentResponse c : gradebook.getComponents()) {
                header.createCell(col++).setCellValue(c.getComponentCode());
            }
            header.createCell(col++).setCellValue("weightedAverage");
            header.createCell(col).setCellValue("letterGrade");

            int r = 1;
            for (StudentGradebookRowResponse row : gradebook.getStudents()) {
                Row x = sheet.createRow(r++);
                x.createCell(0).setCellValue(String.valueOf(row.getUserId()));
                x.createCell(1).setCellValue(row.getUsername());
                x.createCell(2).setCellValue(row.getFullName());
                int c = 3;
                for (StudentGradebookComponentResponse gc : gradebook.getComponents()) {
                    BigDecimal score = row.getScores().get(gc.getId());
                    if (score != null) x.createCell(c).setCellValue(score.doubleValue());
                    c++;
                }
                if (row.getWeightedAverage() != null) x.createCell(c).setCellValue(row.getWeightedAverage().doubleValue());
                c++;
                if (row.getLetterGrade() != null) x.createCell(c).setCellValue(row.getLetterGrade());
            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (IOException e) {
            throw new IllegalArgumentException("Không thể export Excel: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public StudentGradebookResponse importGradebookExcel(Long courseClassId, MultipartFile file) {
        CourseClass cc = courseClassRepository.findById(courseClassId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
        if (cc.isGradebookFinalized()) {
            throw new IllegalArgumentException("Bảng điểm đã chốt, không thể import.");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File import rỗng.");
        }
        List<GradeComponent> components = gradeComponentRepository.findAllByOrderByIdAsc();
        Map<String, GradeComponent> componentByCode = components.stream()
                .collect(Collectors.toMap(c -> c.getComponentCode().trim().toUpperCase(), Function.identity()));

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) throw new IllegalArgumentException("Không có sheet dữ liệu.");
            Row header = sheet.getRow(0);
            if (header == null) throw new IllegalArgumentException("Thiếu dòng tiêu đề.");
            Map<Integer, GradeComponent> componentColumns = new LinkedHashMap<>();
            for (int i = 0; i < header.getLastCellNum(); i++) {
                String h = cellString(header.getCell(i)).trim().toUpperCase();
                if (componentByCode.containsKey(h)) {
                    componentColumns.put(i, componentByCode.get(h));
                }
            }
            if (componentColumns.isEmpty()) {
                throw new IllegalArgumentException("File không có cột thành phần điểm hợp lệ.");
            }
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                final int rowNumber = i + 1;
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String userIdRaw = cellString(row.getCell(0)).trim();
                if (userIdRaw.isEmpty()) continue;
                UUID userId;
                try {
                    userId = UUID.fromString(userIdRaw);
                } catch (Exception ex) {
                    throw new IllegalArgumentException("userId không hợp lệ tại dòng " + rowNumber);
                }
                CourseClassEnrollment enrollment = enrollmentRepository.findByCourseClass_IdAndUser_Id(courseClassId, userId)
                        .orElseThrow(() -> new IllegalArgumentException("Sinh viên không thuộc lớp tại dòng " + rowNumber));
                for (Map.Entry<Integer, GradeComponent> entry : componentColumns.entrySet()) {
                    BigDecimal score = cellDecimal(row.getCell(entry.getKey()));
                    StudentGrade existing = studentGradeRepository
                            .findByEnrollment_IdAndGradeComponent_Id(enrollment.getId(), entry.getValue().getId())
                            .orElse(null);
                    if (score == null) {
                        if (existing != null) studentGradeRepository.delete(existing);
                        continue;
                    }
                    if (score.compareTo(BigDecimal.ZERO) < 0 || score.compareTo(BigDecimal.TEN) > 0) {
                        throw new IllegalArgumentException("Điểm phải trong khoảng 0..10 tại dòng " + rowNumber);
                    }
                    BigDecimal normalized = score.setScale(2, RoundingMode.HALF_UP);
                    if (existing == null) {
                        StudentGrade g = new StudentGrade();
                        g.setEnrollment(enrollment);
                        g.setGradeComponent(entry.getValue());
                        g.setScore(normalized);
                        studentGradeRepository.save(g);
                    } else {
                        existing.setScore(normalized);
                        studentGradeRepository.save(existing);
                    }
                }
            }
            List<CourseClassEnrollment> enrollments = enrollmentRepository.findByCourseClass_IdOrderByEnrolledAtAsc(courseClassId);
            return buildGradebook(cc, components, enrollments);
        } catch (IOException e) {
            throw new IllegalArgumentException("Không đọc được file Excel: " + e.getMessage());
        }
    }

    private StudentGradebookResponse buildGradebook(
            CourseClass cc,
            List<GradeComponent> components,
            List<CourseClassEnrollment> enrollments) {
        List<Long> enrollmentIds = enrollments.stream().map(CourseClassEnrollment::getId).toList();
        List<StudentGrade> grades = enrollmentIds.isEmpty()
                ? List.of()
                : studentGradeRepository.findByEnrollment_IdIn(enrollmentIds);

        Map<Long, Map<Long, BigDecimal>> byEnrollment = new HashMap<>();
        for (StudentGrade g : grades) {
            byEnrollment
                    .computeIfAbsent(g.getEnrollment().getId(), k -> new LinkedHashMap<>())
                    .put(g.getGradeComponent().getId(), g.getScore());
        }

        StudentGradebookResponse dto = new StudentGradebookResponse();
        dto.setCourseClassId(cc.getId());
        dto.setCourseCode(cc.getCourse().getCourseCode());
        dto.setCourseName(cc.getCourse().getCourseName());
        dto.setSectionCode(cc.getSectionCode());
        dto.setClassName(cc.getClassName());
        dto.setAcademicYear(cc.getAcademicYear());
        dto.setSemester(cc.getSemester());
        dto.setGradebookFinalized(cc.isGradebookFinalized());
        dto.setComponents(components.stream().map(this::toComponentDto).toList());
        dto.setStudents(enrollments.stream().map(e -> toRowDto(e, components, byEnrollment.get(e.getId()))).toList());
        return dto;
    }

    private StudentGradebookComponentResponse toComponentDto(GradeComponent c) {
        StudentGradebookComponentResponse dto = new StudentGradebookComponentResponse();
        dto.setId(c.getId());
        dto.setComponentCode(c.getComponentCode());
        dto.setComponentName(c.getComponentName());
        dto.setWeightPercent(c.getWeightPercent());
        return dto;
    }

    private StudentGradebookRowResponse toRowDto(
            CourseClassEnrollment enrollment,
            List<GradeComponent> components,
            Map<Long, BigDecimal> scoreMapRaw) {
        Map<Long, BigDecimal> scoreMap = scoreMapRaw == null ? Map.of() : scoreMapRaw;
        User user = enrollment.getUser();
        StudentGradebookRowResponse row = new StudentGradebookRowResponse();
        row.setEnrollmentId(enrollment.getId());
        row.setUserId(user.getId());
        row.setUsername(user.getUsername());
        row.setFullName(user.getFullName());

        Map<Long, BigDecimal> orderedScores = new LinkedHashMap<>();
        for (GradeComponent c : components) {
            orderedScores.put(c.getId(), scoreMap.get(c.getId()));
        }
        row.setScores(orderedScores);
        BigDecimal weightedAverage = computeWeightedAverage(components, orderedScores);
        row.setWeightedAverage(weightedAverage);
        row.setLetterGrade(gradeScaleService.classify(weightedAverage));
        return row;
    }

    private BigDecimal computeWeightedAverage(List<GradeComponent> components, Map<Long, BigDecimal> orderedScores) {
        int totalWeight = 0;
        BigDecimal weightedSum = BigDecimal.ZERO;
        for (GradeComponent c : components) {
            Integer weight = c.getWeightPercent();
            if (weight == null || weight <= 0) {
                continue;
            }
            BigDecimal score = orderedScores.get(c.getId());
            if (score == null) {
                return null;
            }
            totalWeight += weight;
            weightedSum = weightedSum.add(score.multiply(BigDecimal.valueOf(weight)));
        }
        if (totalWeight <= 0) {
            return null;
        }
        return weightedSum
                .divide(BigDecimal.valueOf(totalWeight), 2, RoundingMode.HALF_UP);
    }

    private static String cellString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> BigDecimal.valueOf(cell.getNumericCellValue()).stripTrailingZeros().toPlainString();
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private static BigDecimal cellDecimal(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case NUMERIC -> BigDecimal.valueOf(cell.getNumericCellValue());
            case STRING -> {
                String raw = cell.getStringCellValue();
                if (raw == null || raw.trim().isEmpty()) yield null;
                String normalized = raw.trim().replace(",", ".");
                try {
                    yield new BigDecimal(normalized);
                } catch (NumberFormatException ex) {
                    throw new IllegalArgumentException(
                            "Giá trị điểm không hợp lệ: " + new String(raw.getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8));
                }
            }
            default -> null;
        };
    }
}
