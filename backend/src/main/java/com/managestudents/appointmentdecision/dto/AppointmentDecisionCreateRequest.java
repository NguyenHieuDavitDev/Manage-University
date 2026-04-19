package com.managestudents.appointmentdecision.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public class AppointmentDecisionCreateRequest {

    @NotNull
    private UUID userId;

    @NotBlank
    @Size(max = 100)
    private String decisionNumber;

    @NotNull
    private LocalDate decisionDate;

    private LocalDate effectiveDate;

    private Long positionId;
    private Long facultyId;
    private Long academicRankId;

    @Size(max = 200)
    private String appointedTitle;

    @Size(max = 1000)
    private String notes;

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
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

    public Long getFacultyId() {
        return facultyId;
    }

    public void setFacultyId(Long facultyId) {
        this.facultyId = facultyId;
    }

    public Long getAcademicRankId() {
        return academicRankId;
    }

    public void setAcademicRankId(Long academicRankId) {
        this.academicRankId = academicRankId;
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
}
