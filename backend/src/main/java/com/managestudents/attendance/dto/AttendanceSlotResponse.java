package com.managestudents.attendance.dto;

import java.time.LocalDate;
import java.util.UUID;

/** Một buổi học cụ thể (một dòng TKB × một ngày diễn ra). */
public class AttendanceSlotResponse {

    private Long classScheduleId;
    private LocalDate sessionDate;
    private Integer dayOfWeek;
    private Integer startPeriod;
    private Integer endPeriod;
    private String roomCode;
    private String roomName;
    private UUID lecturerUserId;
    private String lecturerFullName;
    /** Gợi ý hiển thị: ngày + thứ + tiết + phòng */
    private String label;

    public Long getClassScheduleId() {
        return classScheduleId;
    }

    public void setClassScheduleId(Long classScheduleId) {
        this.classScheduleId = classScheduleId;
    }

    public LocalDate getSessionDate() {
        return sessionDate;
    }

    public void setSessionDate(LocalDate sessionDate) {
        this.sessionDate = sessionDate;
    }

    public Integer getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(Integer dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public Integer getStartPeriod() {
        return startPeriod;
    }

    public void setStartPeriod(Integer startPeriod) {
        this.startPeriod = startPeriod;
    }

    public Integer getEndPeriod() {
        return endPeriod;
    }

    public void setEndPeriod(Integer endPeriod) {
        this.endPeriod = endPeriod;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public UUID getLecturerUserId() {
        return lecturerUserId;
    }

    public void setLecturerUserId(UUID lecturerUserId) {
        this.lecturerUserId = lecturerUserId;
    }

    public String getLecturerFullName() {
        return lecturerFullName;
    }

    public void setLecturerFullName(String lecturerFullName) {
        this.lecturerFullName = lecturerFullName;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }
}
