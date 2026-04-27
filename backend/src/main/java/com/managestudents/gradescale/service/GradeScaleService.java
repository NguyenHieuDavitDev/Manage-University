package com.managestudents.gradescale.service;

import com.managestudents.gradescale.dto.GradeScaleCreateRequest;
import com.managestudents.gradescale.dto.GradeScaleResponse;
import com.managestudents.gradescale.dto.GradeScaleUpdateRequest;

import java.math.BigDecimal;
import java.util.List;

public interface GradeScaleService {

    List<GradeScaleResponse> listAll();

    GradeScaleResponse create(GradeScaleCreateRequest request);

    GradeScaleResponse update(Long id, GradeScaleUpdateRequest request);

    void deleteById(Long id);

    String classify(BigDecimal score);
}
