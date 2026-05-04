package com.managestudents.tuitionrate.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class TuitionRateResponse {

    private Long id;
    private String tuitionCode;
    private String tuitionName;
    private Long trainingProgramId;
    private String trainingProgramCode;
    private String trainingProgramName;
    private Integer trainingProgramTotalCredits;
    private BigDecimal feePerCredit;
    private BigDecimal totalTuition;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public String getTrainingProgramCode() {
        return trainingProgramCode;
    }

    public void setTrainingProgramCode(String trainingProgramCode) {
        this.trainingProgramCode = trainingProgramCode;
    }

    public String getTrainingProgramName() {
        return trainingProgramName;
    }

    public void setTrainingProgramName(String trainingProgramName) {
        this.trainingProgramName = trainingProgramName;
    }

    public Integer getTrainingProgramTotalCredits() {
        return trainingProgramTotalCredits;
    }

    public void setTrainingProgramTotalCredits(Integer trainingProgramTotalCredits) {
        this.trainingProgramTotalCredits = trainingProgramTotalCredits;
    }

    public BigDecimal getFeePerCredit() {
        return feePerCredit;
    }

    public void setFeePerCredit(BigDecimal feePerCredit) {
        this.feePerCredit = feePerCredit;
    }

    public BigDecimal getTotalTuition() {
        return totalTuition;
    }

    public void setTotalTuition(BigDecimal totalTuition) {
        this.totalTuition = totalTuition;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
