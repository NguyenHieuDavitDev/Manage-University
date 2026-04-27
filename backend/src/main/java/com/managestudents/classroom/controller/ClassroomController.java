package com.managestudents.classroom.controller;

import com.managestudents.classroom.dto.ClassroomCreateRequest;
import com.managestudents.classroom.dto.ClassroomResponse;
import com.managestudents.classroom.dto.ClassroomUpdateRequest;
import com.managestudents.classroom.service.ClassroomService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/classrooms")
public class ClassroomController {

    private final ClassroomService classroomService;

    public ClassroomController(ClassroomService classroomService) {
        this.classroomService = classroomService;
    }

    @GetMapping
    public ResponseEntity<Page<ClassroomResponse>> list(
            @RequestParam(name = "q", required = false) String keyword,
            @RequestParam(name = "buildingId", required = false) Long buildingId,
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(classroomService.findAll(keyword, buildingId, pageable));
    }

    @GetMapping("/next-room-code")
    public ResponseEntity<String> nextRoomCode(@RequestParam(name = "floorNumber") int floorNumber) {
        return ResponseEntity.ok(classroomService.nextRoomCode(floorNumber));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClassroomResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(classroomService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<ClassroomResponse> create(@Valid @RequestBody ClassroomCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(classroomService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClassroomResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ClassroomUpdateRequest request) {
        return ResponseEntity.ok(classroomService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        classroomService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
