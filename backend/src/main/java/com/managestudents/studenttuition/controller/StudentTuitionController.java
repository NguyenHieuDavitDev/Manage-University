package com.managestudents.studenttuition.controller;

import com.managestudents.studenttuition.dto.StudentTuitionCreateRequest;
import com.managestudents.studenttuition.dto.StudentTuitionGeneratePlanRequest;
import com.managestudents.studenttuition.dto.StudentTuitionPayRequest;
import com.managestudents.studenttuition.dto.StudentTuitionPaymentHistoryResponse;
import com.managestudents.studenttuition.dto.StudentTuitionPayResponse;
import com.managestudents.studenttuition.dto.StudentTuitionResponse;
import com.managestudents.studenttuition.dto.StudentTuitionUpdateRequest;
import com.managestudents.security.JwtPrincipal;
import com.managestudents.studenttuition.service.StudentTuitionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/student-tuitions")
public class StudentTuitionController {

    private final StudentTuitionService studentTuitionService;

    public StudentTuitionController(StudentTuitionService studentTuitionService) {
        this.studentTuitionService = studentTuitionService;
    }

    @GetMapping
    public ResponseEntity<Page<StudentTuitionResponse>> list(
            @RequestParam(name = "q", required = false) String keyword,
            @RequestParam(name = "userId", required = false) UUID userId,
            @RequestParam(name = "academicYear", required = false) String academicYear,
            @RequestParam(name = "semester", required = false) Integer semester,
            @RequestParam(name = "paymentStatus", required = false) String paymentStatus,
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(studentTuitionService.findAll(
                keyword,
                userId,
                academicYear,
                semester,
                paymentStatus,
                pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentTuitionResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(studentTuitionService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<StudentTuitionResponse> create(@Valid @RequestBody StudentTuitionCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentTuitionService.create(request));
    }

    @PostMapping("/generate-8-semesters")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<List<StudentTuitionResponse>> generateEightSemesters(
            @Valid @RequestBody StudentTuitionGeneratePlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentTuitionService.generateEightSemesterPlan(request));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<StudentTuitionResponse>> mine() {
        JwtPrincipal p = requirePrincipal();
        return ResponseEntity.ok(studentTuitionService.findMine(p.userId()));
    }

    @PostMapping("/mine/{id}/payments")
    public ResponseEntity<StudentTuitionPayResponse> createPayment(
            @PathVariable Long id,
            @Valid @RequestBody StudentTuitionPayRequest request) {
        JwtPrincipal p = requirePrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(studentTuitionService.createPayment(id, p.userId(), request));
    }

    @GetMapping("/mine/payment-history")
    public ResponseEntity<List<StudentTuitionPaymentHistoryResponse>> myPaymentHistory(
            @RequestParam(name = "studentTuitionId", required = false) Long studentTuitionId) {
        JwtPrincipal p = requirePrincipal();
        return ResponseEntity.ok(studentTuitionService.findMyPaymentHistory(p.userId(), studentTuitionId));
    }

    @GetMapping("/payment-history")
    public ResponseEntity<List<StudentTuitionPaymentHistoryResponse>> paymentHistoryForAdmin() {
        return ResponseEntity.ok(studentTuitionService.findPaymentHistoryForAdmin());
    }

    @PostMapping("/payment-gateway/momo/ipn")
    public ResponseEntity<Map<String, Object>> momoIpn(@RequestBody Map<String, Object> payload) {
        studentTuitionService.handleMomoIpn(payload);
        return ResponseEntity.ok(Map.of("resultCode", 0, "message", "Success"));
    }

    @GetMapping(value = "/mine/payments/{paymentId}/invoice-html",
                produces = "text/html;charset=UTF-8")
    public ResponseEntity<String> myInvoiceHtml(@PathVariable Long paymentId) {
        JwtPrincipal p = requirePrincipal();
        String html = studentTuitionService.renderMyInvoiceHtml(paymentId, p.userId());
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header(HttpHeaders.CONTENT_TYPE, "text/html;charset=UTF-8")
                .body(html);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudentTuitionResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody StudentTuitionUpdateRequest request) {
        return ResponseEntity.ok(studentTuitionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        studentTuitionService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private static JwtPrincipal requirePrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof JwtPrincipal p)) {
            throw new BadCredentialsException("Cần đăng nhập");
        }
        return p;
    }
}
