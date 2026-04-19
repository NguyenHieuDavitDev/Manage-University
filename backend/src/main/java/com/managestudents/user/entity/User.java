package com.managestudents.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "Id", columnDefinition = "UNIQUEIDENTIFIER")
    private UUID id;

    @Column(name = "Username", nullable = false, unique = true, columnDefinition = "NVARCHAR(50)")
    private String username;

    @Column(name = "Email", nullable = false, unique = true, columnDefinition = "NVARCHAR(100)")
    private String email;

    @Column(name = "PhoneNumber", columnDefinition = "NVARCHAR(20)")
    private String phoneNumber;

    @Column(name = "PasswordHash", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false, length = 20)
    private UserStatus status;

    @Column(name = "FullName", nullable = false, columnDefinition = "NVARCHAR(150)")
    private String fullName;

    @Column(name = "DOB")
    private LocalDate dob;

    @Column(name = "Gender", columnDefinition = "NVARCHAR(10)")
    private String gender;

    @Column(name = "CCCD", columnDefinition = "NVARCHAR(20)")
    private String cccd;

    @Column(name = "Passport", columnDefinition = "NVARCHAR(20)")
    private String passport;

    @Column(name = "Address", columnDefinition = "NVARCHAR(255)")
    private String address;

    @Column(name = "CurrentAddress", columnDefinition = "NVARCHAR(255)")
    private String currentAddress;

    @Column(name = "PersonalEmail", columnDefinition = "NVARCHAR(100)")
    private String personalEmail;

    @Column(name = "AvatarUrl", columnDefinition = "NVARCHAR(255)")
    private String avatarUrl;

    @Column(name = "Nationality", columnDefinition = "NVARCHAR(50)")
    private String nationality;

    @Column(name = "Ethnicity", columnDefinition = "NVARCHAR(50)")
    private String ethnicity;

    @Column(name = "MaritalStatus", columnDefinition = "NVARCHAR(20)")
    private String maritalStatus;

    @Column(name = "IsEmailVerified", nullable = false, columnDefinition = "BIT")
    private Boolean isEmailVerified = false;

    @Column(name = "IsPhoneVerified", nullable = false, columnDefinition = "BIT")
    private Boolean isPhoneVerified = false;

    @Column(name = "LastLoginAt")
    private Instant lastLoginAt;

    @Column(name = "LastLoginIP", columnDefinition = "NVARCHAR(50)")
    private String lastLoginIp;

    @Column(name = "FailedLoginCount", nullable = false)
    private Integer failedLoginCount = 0;

    @Column(name = "LockoutEnd")
    private Instant lockoutEnd;

    @Column(name = "CreatedAt", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "CreatedBy", columnDefinition = "UNIQUEIDENTIFIER")
    private UUID createdBy;

    @Column(name = "UpdatedAt")
    private Instant updatedAt;

    @Column(name = "UpdatedBy", columnDefinition = "UNIQUEIDENTIFIER")
    private UUID updatedBy;

    @Column(name = "IsDeleted", nullable = false, columnDefinition = "BIT")
    private Boolean isDeleted = false;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        if (isEmailVerified == null) {
            isEmailVerified = false;
        }
        if (isPhoneVerified == null) {
            isPhoneVerified = false;
        }
        if (failedLoginCount == null) {
            failedLoginCount = 0;
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public LocalDate getDob() {
        return dob;
    }

    public void setDob(LocalDate dob) {
        this.dob = dob;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getCccd() {
        return cccd;
    }

    public void setCccd(String cccd) {
        this.cccd = cccd;
    }

    public String getPassport() {
        return passport;
    }

    public void setPassport(String passport) {
        this.passport = passport;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCurrentAddress() {
        return currentAddress;
    }

    public void setCurrentAddress(String currentAddress) {
        this.currentAddress = currentAddress;
    }

    public String getPersonalEmail() {
        return personalEmail;
    }

    public void setPersonalEmail(String personalEmail) {
        this.personalEmail = personalEmail;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    public String getEthnicity() {
        return ethnicity;
    }

    public void setEthnicity(String ethnicity) {
        this.ethnicity = ethnicity;
    }

    public String getMaritalStatus() {
        return maritalStatus;
    }

    public void setMaritalStatus(String maritalStatus) {
        this.maritalStatus = maritalStatus;
    }

    public Boolean getIsEmailVerified() {
        return isEmailVerified;
    }

    public void setIsEmailVerified(Boolean emailVerified) {
        isEmailVerified = emailVerified;
    }

    public Boolean getIsPhoneVerified() {
        return isPhoneVerified;
    }

    public void setIsPhoneVerified(Boolean phoneVerified) {
        isPhoneVerified = phoneVerified;
    }

    public Instant getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(Instant lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }

    public String getLastLoginIp() {
        return lastLoginIp;
    }

    public void setLastLoginIp(String lastLoginIp) {
        this.lastLoginIp = lastLoginIp;
    }

    public Integer getFailedLoginCount() {
        return failedLoginCount;
    }

    public void setFailedLoginCount(Integer failedLoginCount) {
        this.failedLoginCount = failedLoginCount;
    }

    public Instant getLockoutEnd() {
        return lockoutEnd;
    }

    public void setLockoutEnd(Instant lockoutEnd) {
        this.lockoutEnd = lockoutEnd;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public UUID getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(UUID updatedBy) {
        this.updatedBy = updatedBy;
    }

    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean deleted) {
        isDeleted = deleted;
    }
}
