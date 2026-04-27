package com.managestudents.examtype.controller;

import com.managestudents.examtype.dto.ExamTypeCreateRequest;
import com.managestudents.examtype.dto.ExamTypeResponse;
import com.managestudents.examtype.dto.ExamTypeUpdateRequest;
import com.managestudents.examtype.service.ExamTypeService;
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
@RequestMapping("/api/v1/exam-types")
public class ExamTypeController {

    private final ExamTypeService examTypeService;

    public ExamTypeController(ExamTypeService examTypeService) {
        this.examTypeService = examTypeService;
    }

    @GetMapping
    public ResponseEntity<Page<ExamTypeResponse>> list(
            @RequestParam(name = "q", required = false) String keyword,
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(examTypeService.findAll(keyword, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExamTypeResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(examTypeService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<ExamTypeResponse> create(@Valid @RequestBody ExamTypeCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(examTypeService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExamTypeResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ExamTypeUpdateRequest request) {
        return ResponseEntity.ok(examTypeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        examTypeService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
