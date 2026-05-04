package com.managestudents.trainingprogram.service;

import com.managestudents.trainingprogram.dto.TrainingProgramCreateRequest;
import com.managestudents.trainingprogram.dto.TrainingProgramResponse;
import com.managestudents.trainingprogram.dto.TrainingProgramUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TrainingProgramService {

    Page<TrainingProgramResponse> findAll(String keyword, Pageable pageable);

    TrainingProgramResponse findById(Long id);

    TrainingProgramResponse create(TrainingProgramCreateRequest request);

    TrainingProgramResponse update(Long id, TrainingProgramUpdateRequest request);

    void deleteById(Long id);
}
