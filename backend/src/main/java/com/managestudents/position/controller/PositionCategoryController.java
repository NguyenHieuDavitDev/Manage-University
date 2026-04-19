package com.managestudents.position.controller;

import com.managestudents.position.service.PositionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/position-categories")
public class PositionCategoryController {

    private final PositionService positionService;

    public PositionCategoryController(PositionService positionService) {
        this.positionService = positionService;
    }

    @GetMapping
    public ResponseEntity<List<String>> list() {
        return ResponseEntity.ok(positionService.listDistinctPositionCategories());
    }
}
