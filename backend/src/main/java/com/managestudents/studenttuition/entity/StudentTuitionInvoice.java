package com.managestudents.studenttuition.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "student_tuition_invoices")
public class StudentTuitionInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_id", nullable = false, unique = true)
    private StudentTuitionPayment payment;

    @Column(name = "invoice_no", nullable = false, unique = true, columnDefinition = "NVARCHAR(64)")
    private String invoiceNo;

    @Column(name = "invoice_symbol", nullable = false, columnDefinition = "NVARCHAR(32)")
    private String invoiceSymbol;

    @Column(name = "seller_name", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String sellerName;

    @Column(name = "seller_tax_code", nullable = false, columnDefinition = "NVARCHAR(64)")
    private String sellerTaxCode;

    @Column(name = "seller_address", nullable = false, columnDefinition = "NVARCHAR(500)")
    private String sellerAddress;

    @Column(name = "buyer_name", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String buyerName;

    @Column(name = "description", nullable = false, columnDefinition = "NVARCHAR(500)")
    private String description;

    @Column(name = "amount_before_tax", nullable = false, precision = 18, scale = 2)
    private BigDecimal amountBeforeTax;

    @Column(name = "vat_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal vatRate;

    @Column(name = "vat_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal vatAmount;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "status", nullable = false, columnDefinition = "NVARCHAR(20)")
    private String status;

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

    public StudentTuitionPayment getPayment() {
        return payment;
    }

    public void setPayment(StudentTuitionPayment payment) {
        this.payment = payment;
    }

    public String getInvoiceNo() {
        return invoiceNo;
    }

    public void setInvoiceNo(String invoiceNo) {
        this.invoiceNo = invoiceNo;
    }

    public String getInvoiceSymbol() {
        return invoiceSymbol;
    }

    public void setInvoiceSymbol(String invoiceSymbol) {
        this.invoiceSymbol = invoiceSymbol;
    }

    public String getSellerName() {
        return sellerName;
    }

    public void setSellerName(String sellerName) {
        this.sellerName = sellerName;
    }

    public String getSellerTaxCode() {
        return sellerTaxCode;
    }

    public void setSellerTaxCode(String sellerTaxCode) {
        this.sellerTaxCode = sellerTaxCode;
    }

    public String getSellerAddress() {
        return sellerAddress;
    }

    public void setSellerAddress(String sellerAddress) {
        this.sellerAddress = sellerAddress;
    }

    public String getBuyerName() {
        return buyerName;
    }

    public void setBuyerName(String buyerName) {
        this.buyerName = buyerName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getAmountBeforeTax() {
        return amountBeforeTax;
    }

    public void setAmountBeforeTax(BigDecimal amountBeforeTax) {
        this.amountBeforeTax = amountBeforeTax;
    }

    public BigDecimal getVatRate() {
        return vatRate;
    }

    public void setVatRate(BigDecimal vatRate) {
        this.vatRate = vatRate;
    }

    public BigDecimal getVatAmount() {
        return vatAmount;
    }

    public void setVatAmount(BigDecimal vatAmount) {
        this.vatAmount = vatAmount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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
