package com.managestudents.exam.controller;

import com.managestudents.exam.dto.ExamAutoScheduleRequest;
import com.managestudents.exam.dto.ExamCreateRequest;
import com.managestudents.exam.dto.ExamResponse;
import com.managestudents.exam.dto.ExamUpdateRequest;
import com.managestudents.exam.service.ExamService;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/exams")
public class ExamController {
    private final ExamService examService;
    public ExamController(ExamService examService) { this.examService = examService; }

    @GetMapping
    public ResponseEntity<Page<ExamResponse>> list(
            @RequestParam(name = "q", required = false) String keyword,
            @RequestParam(name = "courseClassId", required = false) Long courseClassId,
            @RequestParam(name = "examTypeId", required = false) Long examTypeId,
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(examService.findAll(keyword, courseClassId, examTypeId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExamResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(examService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<ExamResponse> create(@Valid @RequestBody ExamCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(examService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExamResponse> update(@PathVariable Long id, @Valid @RequestBody ExamUpdateRequest request) {
        return ResponseEntity.ok(examService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        examService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/auto-schedule")
    public ResponseEntity<List<ExamResponse>> autoSchedule(@Valid @RequestBody ExamAutoScheduleRequest request) {
        return ResponseEntity.ok(examService.autoSchedule(request));
    }
}
