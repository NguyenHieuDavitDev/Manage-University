package com.managestudents.academicrank.controller;

import com.managestudents.academicrank.dto.AcademicRankCreateRequest;
import com.managestudents.academicrank.dto.AcademicRankResponse;
import com.managestudents.academicrank.dto.AcademicRankUpdateRequest;
import com.managestudents.academicrank.service.AcademicRankService;
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
@RequestMapping("/api/v1/academic-ranks")
public class AcademicRankController {

    private final AcademicRankService academicRankService;

    public AcademicRankController(AcademicRankService academicRankService) {
        this.academicRankService = academicRankService;
    }

    @GetMapping
    public ResponseEntity<Page<AcademicRankResponse>> list(
            @RequestParam(name = "q", required = false) String keyword,
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(academicRankService.findAll(keyword, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AcademicRankResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(academicRankService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<AcademicRankResponse> create(@Valid @RequestBody AcademicRankCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(academicRankService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AcademicRankResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody AcademicRankUpdateRequest request) {
        return ResponseEntity.ok(academicRankService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        academicRankService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
