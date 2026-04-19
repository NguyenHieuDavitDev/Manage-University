package com.managestudents.appointmentdecision.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class AppointmentDecisionResponse {

    private Long id;
    private UUID userId;
    private String userFullName;
    private String decisionNumber;
    private LocalDate decisionDate;
    private LocalDate effectiveDate;
    private Long positionId;
    private String positionName;
    private Long facultyId;
    private String facultyName;
    private Long academicRankId;
    private String academicRankName;
    private String appointedTitle;
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

    public String getDecisionNumber() {
        return decisionNumber;
    }

    public void setDecisionNumber(String decisionNumber) {
        this.decisionNumber = decisionNumber;
    }

    public LocalDate getDecisionDate() {
        return decisionDate;
    }

    public void setDecisionDate(LocalDate decisionDate) {
        this.decisionDate = decisionDate;
    }

    public LocalDate getEffectiveDate() {
        return effectiveDate;
    }

    public void setEffectiveDate(LocalDate effectiveDate) {
        this.effectiveDate = effectiveDate;
    }

    public Long getPositionId() {
        return positionId;
    }

    public void setPositionId(Long positionId) {
        this.positionId = positionId;
    }

    public String getPositionName() {
        return positionName;
    }

    public void setPositionName(String positionName) {
        this.positionName = positionName;
    }

    public Long getFacultyId() {
        return facultyId;
    }

    public void setFacultyId(Long facultyId) {
        this.facultyId = facultyId;
    }

    public String getFacultyName() {
        return facultyName;
    }

    public void setFacultyName(String facultyName) {
        this.facultyName = facultyName;
    }

    public Long getAcademicRankId() {
        return academicRankId;
    }

    public void setAcademicRankId(Long academicRankId) {
        this.academicRankId = academicRankId;
    }

    public String getAcademicRankName() {
        return academicRankName;
    }

    public void setAcademicRankName(String academicRankName) {
        this.academicRankName = academicRankName;
    }

    public String getAppointedTitle() {
        return appointedTitle;
    }

    public void setAppointedTitle(String appointedTitle) {
        this.appointedTitle = appointedTitle;
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
