package com.managestudents.exam.dto;

import java.time.Instant;
import java.time.LocalDate;

public class ExamResponse {
    private Long id;
    private Long courseClassId;
    private String courseCode;
    private String courseName;
    private String sectionCode;
    private Long examTypeId;
    private String examTypeCode;
    private String examTypeName;
    private Long classroomId;
    private String roomCode;
    private String roomName;
    private LocalDate examDate;
    private Integer startPeriod;
    private Integer endPeriod;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCourseClassId() { return courseClassId; }
    public void setCourseClassId(Long courseClassId) { this.courseClassId = courseClassId; }
    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public String getSectionCode() { return sectionCode; }
    public void setSectionCode(String sectionCode) { this.sectionCode = sectionCode; }
    public Long getExamTypeId() { return examTypeId; }
    public void setExamTypeId(Long examTypeId) { this.examTypeId = examTypeId; }
    public String getExamTypeCode() { return examTypeCode; }
    public void setExamTypeCode(String examTypeCode) { this.examTypeCode = examTypeCode; }
    public String getExamTypeName() { return examTypeName; }
    public void setExamTypeName(String examTypeName) { this.examTypeName = examTypeName; }
    public Long getClassroomId() { return classroomId; }
    public void setClassroomId(Long classroomId) { this.classroomId = classroomId; }
    public String getRoomCode() { return roomCode; }
    public void setRoomCode(String roomCode) { this.roomCode = roomCode; }
    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }
    public LocalDate getExamDate() { return examDate; }
    public void setExamDate(LocalDate examDate) { this.examDate = examDate; }
    public Integer getStartPeriod() { return startPeriod; }
    public void setStartPeriod(Integer startPeriod) { this.startPeriod = startPeriod; }
    public Integer getEndPeriod() { return endPeriod; }
    public void setEndPeriod(Integer endPeriod) { this.endPeriod = endPeriod; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
