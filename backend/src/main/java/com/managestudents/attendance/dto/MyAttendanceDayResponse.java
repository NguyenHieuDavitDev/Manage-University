package com.managestudents.attendance.dto;

import java.time.LocalDate;

public class MyAttendanceDayResponse {
    private Long classScheduleId;
    private LocalDate sessionDate;
    private Integer dayOfWeek;
    private Integer startPeriod;
    private Integer endPeriod;
    private String roomCode;
    private String roomName;
    private String lecturerFullName;
    private String slotLabel;
    private String status;

    public LocalDate getSessionDate() {
        return sessionDate;
    }

    public void setSessionDate(LocalDate sessionDate) {
        this.sessionDate = sessionDate;
    }

    public Long getClassScheduleId() {
        return classScheduleId;
    }

    public void setClassScheduleId(Long classScheduleId) {
        this.classScheduleId = classScheduleId;
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

    public String getLecturerFullName() {
        return lecturerFullName;
    }

    public void setLecturerFullName(String lecturerFullName) {
        this.lecturerFullName = lecturerFullName;
    }

    public String getSlotLabel() {
        return slotLabel;
    }

    public void setSlotLabel(String slotLabel) {
        this.slotLabel = slotLabel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
