package com.managestudents.studenttuition.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public class StudentTuitionCreateRequest {

    @NotNull
    private UUID userId;

    private Long tuitionRateId;

    @NotBlank
    @Size(max = 20)
    private String academicYear;

    @NotNull
    @Min(1)
    @Max(3)
    private Integer semester;

    @Min(0)
    private Integer totalCredits;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal amountDue;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal amountPaid;

    @Size(max = 1000)
    private String notes;

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

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public Integer getTotalCredits() {
        return totalCredits;
    }

    public void setTotalCredits(Integer totalCredits) {
        this.totalCredits = totalCredits;
    }

    public BigDecimal getAmountDue() {
        return amountDue;
    }

    public void setAmountDue(BigDecimal amountDue) {
        this.amountDue = amountDue;
    }

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(BigDecimal amountPaid) {
        this.amountPaid = amountPaid;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
