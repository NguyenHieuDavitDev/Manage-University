package com.managestudents.courseclass.dto;

import jakarta.validation.constraints.NotNull;

public class MyCourseClassEnrollmentTransferRequest {

    @NotNull(message = "courseClassId là bắt buộc")
    private Long courseClassId;

    public Long getCourseClassId() {
        return courseClassId;
    }

    public void setCourseClassId(Long courseClassId) {
        this.courseClassId = courseClassId;
    }
}
