package com.managestudents.studenttuition.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class StudentTuitionGeneratePlanRequest {

    @NotNull
    private UUID userId;

    @NotNull
    private Long tuitionRateId;

    @NotNull
    @Min(2000)
    @Max(2100)
    private Integer startYear;

    @NotNull
    @Min(2004)
    @Max(2104)
    private Integer endYear;

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public Long getTuitionRateId() {
        return tuitionRateId;
    }

    public void setTuitionRateId(Long tuitionRateId) {
        this.tuitionRateId = tuitionRateId;
    }

    public Integer getStartYear() {
        return startYear;
    }

    public void setStartYear(Integer startYear) {
        this.startYear = startYear;
    }

    public Integer getEndYear() {
        return endYear;
    }

    public void setEndYear(Integer endYear) {
        this.endYear = endYear;
    }
}
