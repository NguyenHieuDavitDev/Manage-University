package com.managestudents.trainingprogram.controller;

import com.managestudents.trainingprogram.dto.TrainingProgramCreateRequest;
import com.managestudents.trainingprogram.dto.TrainingProgramResponse;
import com.managestudents.trainingprogram.dto.TrainingProgramUpdateRequest;
import com.managestudents.trainingprogram.service.TrainingProgramService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/training-programs")
public class TrainingProgramController {

    private final TrainingProgramService trainingProgramService;

    public TrainingProgramController(TrainingProgramService trainingProgramService) {
        this.trainingProgramService = trainingProgramService;
    }

    @GetMapping
    public ResponseEntity<Page<TrainingProgramResponse>> list(
            @RequestParam(name = "q", required = false) String keyword,
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(trainingProgramService.findAll(keyword, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TrainingProgramResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(trainingProgramService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<TrainingProgramResponse> create(@Valid @RequestBody TrainingProgramCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(trainingProgramService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TrainingProgramResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TrainingProgramUpdateRequest request) {
        return ResponseEntity.ok(trainingProgramService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        trainingProgramService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
