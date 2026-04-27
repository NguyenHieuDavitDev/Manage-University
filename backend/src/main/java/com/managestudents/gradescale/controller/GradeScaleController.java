package com.managestudents.gradescale.controller;

import com.managestudents.gradescale.dto.GradeScaleCreateRequest;
import com.managestudents.gradescale.dto.GradeScaleResponse;
import com.managestudents.gradescale.dto.GradeScaleUpdateRequest;
import com.managestudents.gradescale.service.GradeScaleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/grade-scales")
public class GradeScaleController {

    private final GradeScaleService gradeScaleService;

    public GradeScaleController(GradeScaleService gradeScaleService) {
        this.gradeScaleService = gradeScaleService;
    }

    @GetMapping
    public ResponseEntity<List<GradeScaleResponse>> listAll() {
        return ResponseEntity.ok(gradeScaleService.listAll());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<GradeScaleResponse> create(@Valid @RequestBody GradeScaleCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gradeScaleService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GradeScaleResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody GradeScaleUpdateRequest request) {
        return ResponseEntity.ok(gradeScaleService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        gradeScaleService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
