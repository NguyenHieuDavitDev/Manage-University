package com.managestudents.appointmentdecision.controller;

import com.managestudents.appointmentdecision.dto.AppointmentDecisionCreateRequest;
import com.managestudents.appointmentdecision.dto.AppointmentDecisionResponse;
import com.managestudents.appointmentdecision.dto.AppointmentDecisionUpdateRequest;
import com.managestudents.appointmentdecision.service.AppointmentDecisionService;
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
@RequestMapping("/api/v1/appointment-decisions")
public class AppointmentDecisionController {

    private final AppointmentDecisionService appointmentDecisionService;

    public AppointmentDecisionController(AppointmentDecisionService appointmentDecisionService) {
        this.appointmentDecisionService = appointmentDecisionService;
    }

    @GetMapping
    public ResponseEntity<Page<AppointmentDecisionResponse>> list(
            @RequestParam(name = "userId", required = false) UUID userId,
            @RequestParam(name = "q", required = false) String keyword,
            @PageableDefault(size = 20, sort = "id,desc") Pageable pageable) {
        return ResponseEntity.ok(appointmentDecisionService.findAll(userId, keyword, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentDecisionResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentDecisionService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<AppointmentDecisionResponse> create(
            @Valid @RequestBody AppointmentDecisionCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentDecisionService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AppointmentDecisionResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentDecisionUpdateRequest request) {
        return ResponseEntity.ok(appointmentDecisionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        appointmentDecisionService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
