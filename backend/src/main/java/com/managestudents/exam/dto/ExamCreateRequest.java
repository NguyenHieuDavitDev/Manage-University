package com.managestudents.exam.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class ExamCreateRequest {
    @NotNull
    private Long courseClassId;
    @NotNull
    private Long examTypeId;
    @NotNull
    private Long classroomId;
    @NotNull
    private LocalDate examDate;
    @NotNull @Min(1) @Max(15)
    private Integer startPeriod;
    @NotNull @Min(1) @Max(15)
    private Integer endPeriod;
    @Size(max = 500)
    private String description;

    public Long getCourseClassId() { return courseClassId; }
    public void setCourseClassId(Long courseClassId) { this.courseClassId = courseClassId; }
    public Long getExamTypeId() { return examTypeId; }
    public void setExamTypeId(Long examTypeId) { this.examTypeId = examTypeId; }
    public Long getClassroomId() { return classroomId; }
    public void setClassroomId(Long classroomId) { this.classroomId = classroomId; }
    public LocalDate getExamDate() { return examDate; }
    public void setExamDate(LocalDate examDate) { this.examDate = examDate; }
    public Integer getStartPeriod() { return startPeriod; }
    public void setStartPeriod(Integer startPeriod) { this.startPeriod = startPeriod; }
    public Integer getEndPeriod() { return endPeriod; }
    public void setEndPeriod(Integer endPeriod) { this.endPeriod = endPeriod; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
