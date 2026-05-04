package com.managestudents.studenttuition.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class StudentTuitionResponse {

    private Long id;
    private UUID userId;
    private String userFullName;
    private Long tuitionRateId;
    private String tuitionRateName;
    private String academicYear;
    private Integer semester;
    private Integer totalCredits;
    private BigDecimal amountDue;
    private BigDecimal amountPaid;
    private String paymentStatus;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getUserFullName() {
        return userFullName;
    }

    public void setUserFullName(String userFullName) {
        this.userFullName = userFullName;
    }

    public Long getTuitionRateId() {
        return tuitionRateId;
    }

    public void setTuitionRateId(Long tuitionRateId) {
        this.tuitionRateId = tuitionRateId;
    }

    public String getTuitionRateName() {
        return tuitionRateName;
    }

    public void setTuitionRateName(String tuitionRateName) {
        this.tuitionRateName = tuitionRateName;
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

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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
