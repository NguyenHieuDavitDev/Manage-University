package com.managestudents.gradecomponent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public class GradeComponentCreateRequest {

    @NotBlank
    @Size(max = 64)
    private String componentCode;

    @NotBlank
    @Size(max = 200)
    private String componentName;

    @Size(max = 500)
    private String description;

    @Min(0)
    @Max(100)
    private Integer weightPercent;

    public String getComponentCode() {
        return componentCode;
    }

    public void setComponentCode(String componentCode) {
        this.componentCode = componentCode;
    }

    public String getComponentName() {
        return componentName;
    }

    public void setComponentName(String componentName) {
        this.componentName = componentName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getWeightPercent() {
        return weightPercent;
    }

    public void setWeightPercent(Integer weightPercent) {
        this.weightPercent = weightPercent;
    }
}
