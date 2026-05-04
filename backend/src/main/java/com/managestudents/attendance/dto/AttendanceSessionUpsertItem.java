package com.managestudents.attendance.dto;

import jakarta.validation.constraints.NotNull;

public class AttendanceSessionUpsertItem {

    @NotNull
    private Long enrollmentId;

    @NotNull
    private String status;

    public Long getEnrollmentId() {
        return enrollmentId;
    }

    public void setEnrollmentId(Long enrollmentId) {
        this.enrollmentId = enrollmentId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
