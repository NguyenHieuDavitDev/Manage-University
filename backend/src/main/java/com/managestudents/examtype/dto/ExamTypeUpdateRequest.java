package com.managestudents.examtype.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ExamTypeUpdateRequest {

    @NotBlank
    @Size(max = 64)
    private String examTypeCode;

    @NotBlank
    @Size(max = 200)
    private String examTypeName;

    @Size(max = 500)
    private String description;

    public String getExamTypeCode() {
        return examTypeCode;
    }

    public void setExamTypeCode(String examTypeCode) {
        this.examTypeCode = examTypeCode;
    }

    public String getExamTypeName() {
        return examTypeName;
    }

    public void setExamTypeName(String examTypeName) {
        this.examTypeName = examTypeName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
