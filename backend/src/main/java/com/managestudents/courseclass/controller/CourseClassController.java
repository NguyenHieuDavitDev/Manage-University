package com.managestudents.courseclass.controller;

import com.managestudents.courseclass.dto.CourseClassCreateRequest;
import com.managestudents.courseclass.dto.CourseClassResponse;
import com.managestudents.courseclass.dto.CourseClassUpdateRequest;
import com.managestudents.courseclass.service.CourseClassService;
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
@RequestMapping("/api/v1/course-classes")
public class CourseClassController {

    private final CourseClassService courseClassService;

    public CourseClassController(CourseClassService courseClassService) {
        this.courseClassService = courseClassService;
    }

    @GetMapping
    public ResponseEntity<Page<CourseClassResponse>> list(
            @RequestParam(name = "courseId", required = false) Long courseId,
            @RequestParam(name = "q", required = false) String keyword,
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(courseClassService.findAll(courseId, keyword, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseClassResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(courseClassService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<CourseClassResponse> create(@Valid @RequestBody CourseClassCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseClassService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseClassResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody CourseClassUpdateRequest request) {
        return ResponseEntity.ok(courseClassService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        courseClassService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
