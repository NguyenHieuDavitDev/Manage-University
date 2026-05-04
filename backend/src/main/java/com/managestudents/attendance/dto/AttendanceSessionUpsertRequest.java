package com.managestudents.attendance.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class AttendanceSessionUpsertRequest {

    @NotEmpty
    @Valid
    private List<AttendanceSessionUpsertItem> items;

    public List<AttendanceSessionUpsertItem> getItems() {
        return items;
    }

    public void setItems(List<AttendanceSessionUpsertItem> items) {
        this.items = items;
    }
}
