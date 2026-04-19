package com.managestudents.permission.controller;

import com.managestudents.permission.dto.PermissionCreateRequest;
import com.managestudents.permission.dto.PermissionResponse;
import com.managestudents.permission.dto.PermissionSuggestionResponse;
import com.managestudents.permission.dto.PermissionUpdateRequest;
import com.managestudents.permission.service.PermissionService;
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
@RequestMapping("/api/v1/permissions")
public class PermissionController {

    private final PermissionService permissionService;

    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    /**
     * Gợi ý khi gõ; đặt trước {@code /{id}} để không nhầm path.
     */
    @GetMapping("/suggestions")
    public ResponseEntity<List<PermissionSuggestionResponse>> suggest(
            @RequestParam("q") String q,
            @RequestParam(name = "limit", defaultValue = "8") int limit) {
        return ResponseEntity.ok(permissionService.suggest(q, limit));
    }

    /**
     * Danh sách phân trang; {@code q} — tìm gần đúng theo mã, tên, mô tả.
     */
    @GetMapping
    public ResponseEntity<Page<PermissionResponse>> list(
            @RequestParam(name = "q", required = false) String keyword,
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(permissionService.findAll(keyword, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PermissionResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(permissionService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<PermissionResponse> create(@Valid @RequestBody PermissionCreateRequest request) {
        PermissionResponse body = permissionService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PermissionResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody PermissionUpdateRequest request) {
        return ResponseEntity.ok(permissionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        permissionService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
