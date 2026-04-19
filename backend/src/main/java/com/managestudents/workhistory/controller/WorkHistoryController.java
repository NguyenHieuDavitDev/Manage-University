package com.managestudents.workhistory.controller;

import com.managestudents.workhistory.dto.WorkHistoryCreateRequest;
import com.managestudents.workhistory.dto.WorkHistoryResponse;
import com.managestudents.workhistory.dto.WorkHistoryUpdateRequest;
import com.managestudents.workhistory.service.WorkHistoryService;
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
@RequestMapping("/api/v1/work-histories")
public class WorkHistoryController {

    private final WorkHistoryService workHistoryService;

    public WorkHistoryController(WorkHistoryService workHistoryService) {
        this.workHistoryService = workHistoryService;
    }

    @GetMapping
    public ResponseEntity<Page<WorkHistoryResponse>> list(
            @RequestParam(name = "userId", required = false) UUID userId,
            @RequestParam(name = "q", required = false) String keyword,
            @PageableDefault(size = 20, sort = "id,desc") Pageable pageable) {
        return ResponseEntity.ok(workHistoryService.findAll(userId, keyword, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkHistoryResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(workHistoryService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<WorkHistoryResponse> create(@Valid @RequestBody WorkHistoryCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workHistoryService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkHistoryResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody WorkHistoryUpdateRequest request) {
        return ResponseEntity.ok(workHistoryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        workHistoryService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
