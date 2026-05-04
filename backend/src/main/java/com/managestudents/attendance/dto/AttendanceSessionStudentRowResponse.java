package com.managestudents.attendance.dto;

import java.util.UUID;

public class AttendanceSessionStudentRowResponse {
    private Long enrollmentId;
    private UUID userId;
    private String username;
    private String fullName;
    /** Một trong: PRESENT, ABSENT, EXCUSED, LATE — null nếu chưa điểm danh */
    private String status;

    public Long getEnrollmentId() {
        return enrollmentId;
    }

    public void setEnrollmentId(Long enrollmentId) {
        this.enrollmentId = enrollmentId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
