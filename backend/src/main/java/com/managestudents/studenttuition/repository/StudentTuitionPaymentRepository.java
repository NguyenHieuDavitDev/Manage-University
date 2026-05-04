package com.managestudents.studenttuition.repository;

import com.managestudents.studenttuition.entity.StudentTuitionPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudentTuitionPaymentRepository extends JpaRepository<StudentTuitionPayment, Long> {

    Optional<StudentTuitionPayment> findByMomoOrderId(String momoOrderId);

    Optional<StudentTuitionPayment> findByIdAndStudentTuition_User_Id(Long id, UUID userId);

    List<StudentTuitionPayment> findByStudentTuition_User_IdOrderByCreatedAtDesc(UUID userId);

    List<StudentTuitionPayment> findByStudentTuition_IdAndStudentTuition_User_IdOrderByCreatedAtDesc(Long studentTuitionId, UUID userId);

    List<StudentTuitionPayment> findByStatusOrderByCreatedAtDesc(String status);
}
