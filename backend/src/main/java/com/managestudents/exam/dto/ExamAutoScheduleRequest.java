package com.managestudents.exam.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ExamAutoScheduleRequest {
    @NotNull
    private Long examTypeId;
    @NotNull
    private LocalDate fromDate;
    @NotNull
    private LocalDate toDate;
    private List<Long> classroomIds = new ArrayList<>();

    public Long getExamTypeId() { return examTypeId; }
    public void setExamTypeId(Long examTypeId) { this.examTypeId = examTypeId; }
    public LocalDate getFromDate() { return fromDate; }
    public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }
    public LocalDate getToDate() { return toDate; }
    public void setToDate(LocalDate toDate) { this.toDate = toDate; }
    public List<Long> getClassroomIds() { return classroomIds; }
    public void setClassroomIds(List<Long> classroomIds) { this.classroomIds = classroomIds; }
}
