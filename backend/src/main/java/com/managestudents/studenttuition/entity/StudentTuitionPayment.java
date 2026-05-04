package com.managestudents.studenttuition.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "student_tuition_payments")
public class StudentTuitionPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_tuition_id", nullable = false)
    private StudentTuition studentTuition;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "status", nullable = false, columnDefinition = "NVARCHAR(20)")
    private String status;

    @Column(name = "provider", nullable = false, columnDefinition = "NVARCHAR(32)")
    private String provider;

    @Column(name = "momo_order_id", columnDefinition = "NVARCHAR(100)")
    private String momoOrderId;

    @Column(name = "momo_request_id", columnDefinition = "NVARCHAR(100)")
    private String momoRequestId;

    @Column(name = "momo_trans_id", columnDefinition = "NVARCHAR(100)")
    private String momoTransId;

    @Column(name = "pay_url", length = 1000)
    private String payUrl;

    @Column(name = "deeplink", length = 1000)
    private String deeplink;

    @Column(name = "qr_code_url", length = 1000)
    private String qrCodeUrl;

    @Column(name = "raw_response", columnDefinition = "NVARCHAR(MAX)")
    private String rawResponse;

    @Column(name = "raw_ipn", columnDefinition = "NVARCHAR(MAX)")
    private String rawIpn;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public StudentTuition getStudentTuition() {
        return studentTuition;
    }

    public void setStudentTuition(StudentTuition studentTuition) {
        this.studentTuition = studentTuition;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getMomoOrderId() {
        return momoOrderId;
    }

    public void setMomoOrderId(String momoOrderId) {
        this.momoOrderId = momoOrderId;
    }

    public String getMomoRequestId() {
        return momoRequestId;
    }

    public void setMomoRequestId(String momoRequestId) {
        this.momoRequestId = momoRequestId;
    }

    public String getMomoTransId() {
        return momoTransId;
    }

    public void setMomoTransId(String momoTransId) {
        this.momoTransId = momoTransId;
    }

    public String getPayUrl() {
        return payUrl;
    }

    public void setPayUrl(String payUrl) {
        this.payUrl = payUrl;
    }

    public String getDeeplink() {
        return deeplink;
    }

    public void setDeeplink(String deeplink) {
        this.deeplink = deeplink;
    }

    public String getQrCodeUrl() {
        return qrCodeUrl;
    }

    public void setQrCodeUrl(String qrCodeUrl) {
        this.qrCodeUrl = qrCodeUrl;
    }

    public String getRawResponse() {
        return rawResponse;
    }

    public void setRawResponse(String rawResponse) {
        this.rawResponse = rawResponse;
    }

    public String getRawIpn() {
        return rawIpn;
    }

    public void setRawIpn(String rawIpn) {
        this.rawIpn = rawIpn;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
