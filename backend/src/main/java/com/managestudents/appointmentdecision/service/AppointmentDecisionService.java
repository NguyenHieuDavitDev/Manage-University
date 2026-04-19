package com.managestudents.appointmentdecision.service;

import com.managestudents.appointmentdecision.dto.AppointmentDecisionCreateRequest;
import com.managestudents.appointmentdecision.dto.AppointmentDecisionResponse;
import com.managestudents.appointmentdecision.dto.AppointmentDecisionUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AppointmentDecisionService {

    Page<AppointmentDecisionResponse> findAll(UUID userId, String keyword, Pageable pageable);

    AppointmentDecisionResponse findById(Long id);

    AppointmentDecisionResponse create(AppointmentDecisionCreateRequest request);

    AppointmentDecisionResponse update(Long id, AppointmentDecisionUpdateRequest request);

    void deleteById(Long id);
}
