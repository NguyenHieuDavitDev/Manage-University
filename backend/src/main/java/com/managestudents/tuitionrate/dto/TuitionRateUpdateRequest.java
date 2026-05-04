package com.managestudents.tuitionrate.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class TuitionRateUpdateRequest {

    @NotBlank
    @Size(max = 64)
    private String tuitionCode;

    @NotBlank
    @Size(max = 200)
    private String tuitionName;

    @NotNull
    private Long trainingProgramId;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal feePerCredit;

    @Size(max = 500)
    private String description;

    public String getTuitionCode() {
        return tuitionCode;
    }

    public void setTuitionCode(String tuitionCode) {
        this.tuitionCode = tuitionCode;
    }

    public String getTuitionName() {
        return tuitionName;
    }

    public void setTuitionName(String tuitionName) {
        this.tuitionName = tuitionName;
    }

    public Long getTrainingProgramId() {
        return trainingProgramId;
    }

    public void setTrainingProgramId(Long trainingProgramId) {
        this.trainingProgramId = trainingProgramId;
    }

    public BigDecimal getFeePerCredit() {
        return feePerCredit;
    }

    public void setFeePerCredit(BigDecimal feePerCredit) {
        this.feePerCredit = feePerCredit;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
