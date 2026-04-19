package com.managestudents.faculty.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class FacultyUpdateRequest {

    @NotBlank
    @Size(max = 64)
    private String facultyCode;

    @NotBlank
    @Size(max = 200)
    private String facultyName;

    @Size(max = 500)
    private String description;

    public String getFacultyCode() {
        return facultyCode;
    }

    public void setFacultyCode(String facultyCode) {
        this.facultyCode = facultyCode;
    }

    public String getFacultyName() {
        return facultyName;
    }

    public void setFacultyName(String facultyName) {
        this.facultyName = facultyName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
