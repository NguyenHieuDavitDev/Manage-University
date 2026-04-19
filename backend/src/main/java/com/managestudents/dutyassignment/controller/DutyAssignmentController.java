package com.managestudents.dutyassignment.controller;

import com.managestudents.dutyassignment.dto.DutyAssignmentCreateRequest;
import com.managestudents.dutyassignment.dto.DutyAssignmentOrgRequest;
import com.managestudents.dutyassignment.dto.DutyAssignmentResponse;
import com.managestudents.dutyassignment.service.DutyAssignmentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
@RequestMapping("/api/v1/duty-assignments")
public class DutyAssignmentController {

    private final DutyAssignmentService dutyAssignmentService;

    public DutyAssignmentController(DutyAssignmentService dutyAssignmentService) {
        this.dutyAssignmentService = dutyAssignmentService;
    }

    @GetMapping
    public ResponseEntity<Page<DutyAssignmentResponse>> list(
            @RequestParam(name = "q", required = false) String keyword,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(dutyAssignmentService.findAll(keyword, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DutyAssignmentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(dutyAssignmentService.findById(id));
    }

    @GetMapping("/by-user/{userId}")
    public ResponseEntity<DutyAssignmentResponse> getByUser(@PathVariable UUID userId) {
        return dutyAssignmentService.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<DutyAssignmentResponse> create(@Valid @RequestBody DutyAssignmentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dutyAssignmentService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DutyAssignmentResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody DutyAssignmentOrgRequest request) {
        return ResponseEntity.ok(dutyAssignmentService.update(id, request));
    }

    @PutMapping("/by-user/{userId}")
    public ResponseEntity<DutyAssignmentResponse> upsertByUser(
            @PathVariable UUID userId,
            @Valid @RequestBody DutyAssignmentOrgRequest request) {
        return ResponseEntity.ok(dutyAssignmentService.upsertByUser(userId, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        dutyAssignmentService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/by-user/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> deleteByUser(@PathVariable UUID userId) {
        dutyAssignmentService.deleteByUserId(userId);
        return ResponseEntity.noContent().build();
    }
}
