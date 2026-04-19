package com.managestudents.academicrank.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AcademicRankCreateRequest {

    @NotBlank
    @Size(max = 64)
    private String rankCode;

    @NotBlank
    @Size(max = 200)
    private String rankName;

    @Size(max = 500)
    private String description;

    public String getRankCode() {
        return rankCode;
    }

    public void setRankCode(String rankCode) {
        this.rankCode = rankCode;
    }

    public String getRankName() {
        return rankName;
    }

    public void setRankName(String rankName) {
        this.rankName = rankName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
