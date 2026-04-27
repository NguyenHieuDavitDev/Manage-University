package com.managestudents.studentgrade.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class StudentGradeUpsertRequest {

    @NotNull
    @Size(min = 1)
    @Valid
    private List<StudentGradeComponentScoreRequest> scores = new ArrayList<>();

    public List<StudentGradeComponentScoreRequest> getScores() {
        return scores;
    }

    public void setScores(List<StudentGradeComponentScoreRequest> scores) {
        this.scores = scores;
    }
}
