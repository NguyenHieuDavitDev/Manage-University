package com.managestudents.studentgrade.service;

import com.managestudents.studentgrade.dto.StudentGradeUpsertRequest;
import com.managestudents.studentgrade.dto.StudentGradebookResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.util.UUID;

public interface StudentGradeService {

    StudentGradebookResponse getGradebook(Long courseClassId);
    StudentGradebookResponse getGradebookForStudent(Long courseClassId, UUID userId);

    StudentGradebookResponse upsertStudentScores(Long courseClassId, UUID userId, StudentGradeUpsertRequest request);

    StudentGradebookResponse finalizeGradebook(Long courseClassId, boolean finalized);

    ByteArrayInputStream exportGradebookExcel(Long courseClassId);

    StudentGradebookResponse importGradebookExcel(Long courseClassId, MultipartFile file);
}
