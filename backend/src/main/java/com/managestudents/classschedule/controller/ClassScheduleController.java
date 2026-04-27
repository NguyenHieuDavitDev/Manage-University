package com.managestudents.classschedule.controller;

import com.managestudents.classschedule.dto.ClassScheduleCreateRequest;
import com.managestudents.classschedule.dto.ClassScheduleMoveRequest;
import com.managestudents.classschedule.dto.ClassScheduleResponse;
import com.managestudents.classschedule.dto.ClassScheduleUpdateRequest;
import com.managestudents.classschedule.service.ClassScheduleService;
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
import org.springframework.web.bind.annotation.PatchMapping;

@RestController
@RequestMapping("/api/v1/class-schedules")
public class ClassScheduleController {

    private final ClassScheduleService classScheduleService;

    public ClassScheduleController(ClassScheduleService classScheduleService) {
        this.classScheduleService = classScheduleService;
    }

    @GetMapping
    public ResponseEntity<Page<ClassScheduleResponse>> list(
            @RequestParam(name = "q", required = false) String keyword,
            @RequestParam(name = "courseClassId", required = false) Long courseClassId,
            @RequestParam(name = "classroomId", required = false) Long classroomId,
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(classScheduleService.findAll(keyword, courseClassId, classroomId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClassScheduleResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(classScheduleService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<ClassScheduleResponse> create(@Valid @RequestBody ClassScheduleCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(classScheduleService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClassScheduleResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ClassScheduleUpdateRequest request) {
        return ResponseEntity.ok(classScheduleService.update(id, request));
    }

    @PatchMapping("/{id}/move")
    public ResponseEntity<ClassScheduleResponse> move(
            @PathVariable Long id,
            @Valid @RequestBody ClassScheduleMoveRequest request) {
        return ResponseEntity.ok(classScheduleService.move(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        classScheduleService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
