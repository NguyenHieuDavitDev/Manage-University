package com.managestudents.studentgrade.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class StudentGradeComponentScoreRequest {

    @NotNull
    private Long gradeComponentId;

    @DecimalMin(value = "0.0")
    @DecimalMax(value = "10.0")
    private BigDecimal score;

    public Long getGradeComponentId() {
        return gradeComponentId;
    }

    public void setGradeComponentId(Long gradeComponentId) {
        this.gradeComponentId = gradeComponentId;
    }

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal score) {
        this.score = score;
    }
}
