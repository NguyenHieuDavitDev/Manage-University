package com.managestudents.dutyassignment.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class DutyAssignmentCreateRequest extends DutyAssignmentOrgRequest {

    @NotNull
    private UUID userId;

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }
}
