package com.managestudents.researchwork.controller;

import com.managestudents.researchwork.dto.ResearchWorkCreateRequest;
import com.managestudents.researchwork.dto.ResearchWorkResponse;
import com.managestudents.researchwork.dto.ResearchWorkUpdateRequest;
import com.managestudents.researchwork.service.ResearchWorkService;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/research-works")
public class ResearchWorkController {

    private final ResearchWorkService researchWorkService;

    public ResearchWorkController(ResearchWorkService researchWorkService) {
        this.researchWorkService = researchWorkService;
    }

    @GetMapping
    public ResponseEntity<Page<ResearchWorkResponse>> list(
            @RequestParam(name = "userId", required = false) UUID userId,
            @RequestParam(name = "q", required = false) String keyword,
            @RequestParam(name = "workType", required = false) String workType,
            @PageableDefault(size = 20, sort = "id,desc") Pageable pageable) {
        return ResponseEntity.ok(researchWorkService.findAll(userId, keyword, workType, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResearchWorkResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(researchWorkService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<ResearchWorkResponse> create(@Valid @RequestBody ResearchWorkCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(researchWorkService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResearchWorkResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ResearchWorkUpdateRequest request) {
        return ResponseEntity.ok(researchWorkService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        researchWorkService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
