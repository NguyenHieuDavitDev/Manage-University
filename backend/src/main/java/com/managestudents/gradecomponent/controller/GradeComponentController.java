package com.managestudents.gradecomponent.controller;

import com.managestudents.gradecomponent.dto.GradeComponentCreateRequest;
import com.managestudents.gradecomponent.dto.GradeComponentResponse;
import com.managestudents.gradecomponent.dto.GradeComponentUpdateRequest;
import com.managestudents.gradecomponent.service.GradeComponentService;
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
@RequestMapping("/api/v1/grade-components")
public class GradeComponentController {

    private final GradeComponentService gradeComponentService;

    public GradeComponentController(GradeComponentService gradeComponentService) {
        this.gradeComponentService = gradeComponentService;
    }

    @GetMapping
    public ResponseEntity<Page<GradeComponentResponse>> list(
            @RequestParam(name = "q", required = false) String keyword,
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(gradeComponentService.findAll(keyword, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GradeComponentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(gradeComponentService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<GradeComponentResponse> create(@Valid @RequestBody GradeComponentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gradeComponentService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GradeComponentResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody GradeComponentUpdateRequest request) {
        return ResponseEntity.ok(gradeComponentService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        gradeComponentService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
