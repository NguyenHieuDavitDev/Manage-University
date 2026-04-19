package com.managestudents.dutyassignment.dto;

/** Gán khoa / phòng ban / chức vụ (có thể null để bỏ gán). */
public class DutyAssignmentOrgRequest {

    private Long facultyId;
    private Long departmentId;
    private Long positionId;

    public Long getFacultyId() {
        return facultyId;
    }

    public void setFacultyId(Long facultyId) {
        this.facultyId = facultyId;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public Long getPositionId() {
        return positionId;
    }

    public void setPositionId(Long positionId) {
        this.positionId = positionId;
    }
}
