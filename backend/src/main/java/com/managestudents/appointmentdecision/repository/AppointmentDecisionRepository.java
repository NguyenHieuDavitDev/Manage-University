package com.managestudents.appointmentdecision.repository;

import com.managestudents.appointmentdecision.entity.AppointmentDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface AppointmentDecisionRepository
        extends JpaRepository<AppointmentDecision, Long>, JpaSpecificationExecutor<AppointmentDecision> {

    boolean existsByUser_IdAndDecisionNumber(UUID userId, String decisionNumber);

    boolean existsByUser_IdAndDecisionNumberAndIdNot(UUID userId, String decisionNumber, Long id);
}
