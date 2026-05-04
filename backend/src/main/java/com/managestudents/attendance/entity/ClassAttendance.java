package com.managestudents.attendance.entity;

import com.managestudents.classschedule.entity.ClassSchedule;
import com.managestudents.courseclass.entity.CourseClassEnrollment;
import com.managestudents.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        name = "class_attendance",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uk_class_attendance_enrollment_schedule_session",
                        columnNames = {"enrollment_id", "class_schedule_id", "session_date"}))
public class ClassAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false)
    private CourseClassEnrollment enrollment;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "class_schedule_id", nullable = false)
    private ClassSchedule classSchedule;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AttendanceStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by_user_id", referencedColumnName = "Id")
    private User recordedByUser;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CourseClassEnrollment getEnrollment() {
        return enrollment;
    }

    public void setEnrollment(CourseClassEnrollment enrollment) {
        this.enrollment = enrollment;
    }

    public ClassSchedule getClassSchedule() {
        return classSchedule;
    }

    public void setClassSchedule(ClassSchedule classSchedule) {
        this.classSchedule = classSchedule;
    }

    public LocalDate getSessionDate() {
        return sessionDate;
    }

    public void setSessionDate(LocalDate sessionDate) {
        this.sessionDate = sessionDate;
    }

    public AttendanceStatus getStatus() {
        return status;
    }

    public void setStatus(AttendanceStatus status) {
        this.status = status;
    }

    public User getRecordedByUser() {
        return recordedByUser;
    }

    public void setRecordedByUser(User recordedByUser) {
        this.recordedByUser = recordedByUser;
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
