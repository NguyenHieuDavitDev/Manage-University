package com.managestudents.credential.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public class CredentialCreateRequest {

    @NotNull
    private UUID userId;

    @NotBlank
    @Size(max = 300)
    private String credentialName;

    @NotBlank
    @Size(max = 50)
    private String credentialCategory;

    @Size(max = 300)
    private String issuingOrganization;

    @Size(max = 100)
    private String credentialNumber;

    @NotNull
    private LocalDate issueDate;

    private LocalDate expiryDate;

    @Size(max = 1000)
    private String notes;

    @Size(max = 512)
    private String attachmentUrl;

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getCredentialName() {
        return credentialName;
    }

    public void setCredentialName(String credentialName) {
        this.credentialName = credentialName;
    }

    public String getCredentialCategory() {
        return credentialCategory;
    }

    public void setCredentialCategory(String credentialCategory) {
        this.credentialCategory = credentialCategory;
    }

    public String getIssuingOrganization() {
        return issuingOrganization;
    }

    public void setIssuingOrganization(String issuingOrganization) {
        this.issuingOrganization = issuingOrganization;
    }

    public String getCredentialNumber() {
        return credentialNumber;
    }

    public void setCredentialNumber(String credentialNumber) {
        this.credentialNumber = credentialNumber;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getAttachmentUrl() {
        return attachmentUrl;
    }

    public void setAttachmentUrl(String attachmentUrl) {
        this.attachmentUrl = attachmentUrl;
    }
}
