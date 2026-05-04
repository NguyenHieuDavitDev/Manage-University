package com.managestudents.studenttuition.service;

import com.managestudents.studenttuition.dto.StudentTuitionCreateRequest;
import com.managestudents.studenttuition.dto.StudentTuitionGeneratePlanRequest;
import com.managestudents.studenttuition.dto.StudentTuitionPayRequest;
import com.managestudents.studenttuition.dto.StudentTuitionPaymentHistoryResponse;
import com.managestudents.studenttuition.dto.StudentTuitionPayResponse;
import com.managestudents.studenttuition.dto.StudentTuitionResponse;
import com.managestudents.studenttuition.dto.StudentTuitionUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface StudentTuitionService {

    Page<StudentTuitionResponse> findAll(
            String keyword,
            UUID userId,
            String academicYear,
            Integer semester,
            String paymentStatus,
            Pageable pageable);

    StudentTuitionResponse findById(Long id);

    StudentTuitionResponse create(StudentTuitionCreateRequest request);

    StudentTuitionResponse update(Long id, StudentTuitionUpdateRequest request);

    void deleteById(Long id);

    List<StudentTuitionResponse> generateEightSemesterPlan(StudentTuitionGeneratePlanRequest request);

    List<StudentTuitionResponse> findMine(UUID userId);

    StudentTuitionPayResponse createPayment(Long studentTuitionId, UUID userId, StudentTuitionPayRequest request);

    List<StudentTuitionPaymentHistoryResponse> findPaymentHistoryForAdmin();

    List<StudentTuitionPaymentHistoryResponse> findMyPaymentHistory(UUID userId, Long studentTuitionId);

    void handleMomoIpn(Map<String, Object> payload);

    String renderMyInvoiceHtml(Long paymentId, UUID userId);
}
