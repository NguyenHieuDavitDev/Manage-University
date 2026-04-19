package com.managestudents.researchwork.controller;

import com.managestudents.researchwork.service.ResearchWorkService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/research-work-types")
public class ResearchWorkTypeController {

    private final ResearchWorkService researchWorkService;

    public ResearchWorkTypeController(ResearchWorkService researchWorkService) {
        this.researchWorkService = researchWorkService;
    }

    @GetMapping
    public ResponseEntity<List<String>> list() {
        return ResponseEntity.ok(researchWorkService.listDistinctWorkTypes());
    }
}
