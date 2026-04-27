package com.managestudents.gradescale.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class GradeScaleCreateRequest {

    @NotBlank
    @Size(max = 8)
    private String letterGrade;

    @NotNull
    @DecimalMin(value = "0.0")
    @DecimalMax(value = "10.0")
    private BigDecimal minScore;

    @NotNull
    @DecimalMin(value = "0.0")
    @DecimalMax(value = "10.0")
    private BigDecimal maxScore;

    @Size(max = 255)
    private String description;

    public String getLetterGrade() {
        return letterGrade;
    }

    public void setLetterGrade(String letterGrade) {
        this.letterGrade = letterGrade;
    }

    public BigDecimal getMinScore() {
        return minScore;
    }

    public void setMinScore(BigDecimal minScore) {
        this.minScore = minScore;
    }

    public BigDecimal getMaxScore() {
        return maxScore;
    }

    public void setMaxScore(BigDecimal maxScore) {
        this.maxScore = maxScore;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
