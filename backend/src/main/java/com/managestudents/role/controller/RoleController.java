package com.managestudents.role.controller;

import com.managestudents.role.dto.RoleCreateRequest;
import com.managestudents.role.dto.RoleResponse;
import com.managestudents.role.dto.RoleSuggestionResponse;
import com.managestudents.role.dto.RoleUpdateRequest;
import com.managestudents.role.service.RoleService;
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
@RequestMapping("/api/v1/roles")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    /**
     * Gợi ý khi gõ (realtime); đặt trước {@code /{id}} để không nhầm path.
     */
    @GetMapping("/suggestions")
    public ResponseEntity<List<RoleSuggestionResponse>> suggest(
            @RequestParam("q") String q,
            @RequestParam(name = "limit", defaultValue = "8") int limit) {
        return ResponseEntity.ok(roleService.suggest(q, limit));
    }

    /**
     * Danh sách có phân trang; tham số {@code q} — tìm kiếm gần đúng theo mã, tên, mô tả.
     */
    @GetMapping
    public ResponseEntity<Page<RoleResponse>> list(
            @RequestParam(name = "q", required = false) String keyword,
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(roleService.findAll(keyword, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoleResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(roleService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<RoleResponse> create(@Valid @RequestBody RoleCreateRequest request) {
        RoleResponse body = roleService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoleResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody RoleUpdateRequest request) {
        return ResponseEntity.ok(roleService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        roleService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
