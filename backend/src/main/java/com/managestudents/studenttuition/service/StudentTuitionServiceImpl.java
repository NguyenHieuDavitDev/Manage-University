package com.managestudents.studenttuition.service;

import com.managestudents.common.exception.DuplicateResourceFieldException;
import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.payment.momo.MomoProperties;
import com.managestudents.studenttuition.InvoiceProperties;
import com.managestudents.studenttuition.dto.StudentTuitionCreateRequest;
import com.managestudents.studenttuition.dto.StudentTuitionGeneratePlanRequest;
import com.managestudents.studenttuition.dto.StudentTuitionPayRequest;
import com.managestudents.studenttuition.dto.StudentTuitionPaymentHistoryResponse;
import com.managestudents.studenttuition.dto.StudentTuitionPayResponse;
import com.managestudents.studenttuition.dto.StudentTuitionResponse;
import com.managestudents.studenttuition.dto.StudentTuitionUpdateRequest;
import com.managestudents.studenttuition.entity.StudentTuitionInvoice;
import com.managestudents.studenttuition.entity.StudentTuition;
import com.managestudents.studenttuition.entity.StudentTuitionPayment;
import com.managestudents.studenttuition.repository.StudentTuitionInvoiceRepository;
import com.managestudents.studenttuition.repository.StudentTuitionPaymentRepository;
import com.managestudents.studenttuition.repository.StudentTuitionRepository;
import com.managestudents.studenttuition.repository.StudentTuitionSpecifications;
import com.managestudents.tuitionrate.entity.TuitionRate;
import com.managestudents.tuitionrate.repository.TuitionRateRepository;
import com.managestudents.user.entity.User;
import com.managestudents.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.text.DecimalFormat;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

@Service
public class StudentTuitionServiceImpl implements StudentTuitionService {
    private static final String METHOD_MOMO = "MOMO";
    private static final String METHOD_MANUAL = "MANUAL";
    private static final String METHOD_BANK_TRANSFER = "BANK_TRANSFER";
    private static final String METHOD_CARD = "CARD";
    private static final String PAYMENT_PENDING = "PENDING";
    private static final String PAYMENT_SUCCESS = "SUCCESS";
    private static final String PAYMENT_FAILED = "FAILED";

    private final StudentTuitionRepository studentTuitionRepository;
    private final StudentTuitionPaymentRepository studentTuitionPaymentRepository;
    private final UserRepository userRepository;
    private final TuitionRateRepository tuitionRateRepository;
    private final StudentTuitionInvoiceRepository studentTuitionInvoiceRepository;
    private final MomoProperties momoProperties;
    private final InvoiceProperties invoiceProperties;
    private final RestTemplate restTemplate = new RestTemplate();

    public StudentTuitionServiceImpl(
            StudentTuitionRepository studentTuitionRepository,
            StudentTuitionPaymentRepository studentTuitionPaymentRepository,
            UserRepository userRepository,
            TuitionRateRepository tuitionRateRepository,
            StudentTuitionInvoiceRepository studentTuitionInvoiceRepository,
            MomoProperties momoProperties,
            InvoiceProperties invoiceProperties) {
        this.studentTuitionRepository = studentTuitionRepository;
        this.studentTuitionPaymentRepository = studentTuitionPaymentRepository;
        this.userRepository = userRepository;
        this.tuitionRateRepository = tuitionRateRepository;
        this.studentTuitionInvoiceRepository = studentTuitionInvoiceRepository;
        this.momoProperties = momoProperties;
        this.invoiceProperties = invoiceProperties;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StudentTuitionResponse> findAll(
            String keyword,
            UUID userId,
            String academicYear,
            Integer semester,
            String paymentStatus,
            Pageable pageable) {
        Specification<StudentTuition> spec = StudentTuitionSpecifications.filter(keyword, userId, academicYear, semester, paymentStatus);
        return studentTuitionRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentTuitionResponse findById(Long id) {
        StudentTuition e = studentTuitionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học phí sinh viên"));
        return toResponse(e);
    }

    @Override
    @Transactional
    public StudentTuitionResponse create(StudentTuitionCreateRequest request) {
        UUID userId = request.getUserId();
        User user = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        String academicYear = normalize(request.getAcademicYear());
        Integer semester = request.getSemester();
        if (studentTuitionRepository.existsByUser_IdAndAcademicYearAndSemester(userId, academicYear, semester)) {
            throw new DuplicateResourceFieldException("semester", "Sinh viên đã có học phí cho học kỳ này");
        }
        StudentTuition e = new StudentTuition();
        e.setUser(user);
        apply(e, academicYear, semester, request.getTotalCredits(), request.getAmountDue(), request.getAmountPaid(), request.getNotes());
        e.setTuitionRate(resolveTuitionRate(request.getTuitionRateId()));
        return toResponse(studentTuitionRepository.save(e));
    }

    @Override
    @Transactional
    public StudentTuitionResponse update(Long id, StudentTuitionUpdateRequest request) {
        StudentTuition e = studentTuitionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học phí sinh viên"));
        UUID userId = request.getUserId();
        User user = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        String academicYear = normalize(request.getAcademicYear());
        Integer semester = request.getSemester();
        if (studentTuitionRepository.existsByUser_IdAndAcademicYearAndSemesterAndIdNot(userId, academicYear, semester, id)) {
            throw new DuplicateResourceFieldException("semester", "Sinh viên đã có học phí cho học kỳ này");
        }
        e.setUser(user);
        e.setTuitionRate(resolveTuitionRate(request.getTuitionRateId()));
        apply(e, academicYear, semester, request.getTotalCredits(), request.getAmountDue(), request.getAmountPaid(), request.getNotes());
        return toResponse(studentTuitionRepository.save(e));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!studentTuitionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy học phí sinh viên");
        }
        studentTuitionRepository.deleteById(id);
    }

    @Override
    @Transactional
    public List<StudentTuitionResponse> generateEightSemesterPlan(StudentTuitionGeneratePlanRequest request) {
        UUID userId = request.getUserId();
        User user = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        TuitionRate tuitionRate = tuitionRateRepository.findById(request.getTuitionRateId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mức học phí"));

        int startYear = request.getStartYear();
        int endYear = request.getEndYear();
        if (endYear - startYear != 4) {
            throw new IllegalArgumentException("Năm kết thúc phải cách năm bắt đầu đúng 4 năm");
        }
        if (tuitionRate.getTrainingProgram() == null || tuitionRate.getTrainingProgram().getTotalCredits() == null) {
            throw new IllegalArgumentException("Mức học phí chưa gắn chương trình đào tạo hợp lệ");
        }
        if (tuitionRate.getFeePerCredit() == null || tuitionRate.getFeePerCredit().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Mức học phí chưa có đơn giá theo tín chỉ hợp lệ");
        }

        BigDecimal totalTuition = tuitionRate.getFeePerCredit()
                .multiply(BigDecimal.valueOf(tuitionRate.getTrainingProgram().getTotalCredits()))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal installment = totalTuition.divide(BigDecimal.valueOf(8), 2, RoundingMode.DOWN);
        BigDecimal remainder = totalTuition.subtract(installment.multiply(BigDecimal.valueOf(8)));

        List<StudentTuition> toSave = new ArrayList<>();
        for (int yearOffset = 0; yearOffset < 4; yearOffset++) {
            int y1 = startYear + yearOffset;
            int y2 = y1 + 1;
            String academicYear = y1 + "-" + y2;
            for (int semester = 1; semester <= 2; semester++) {
                if (studentTuitionRepository.existsByUser_IdAndAcademicYearAndSemester(userId, academicYear, semester)) {
                    throw new DuplicateResourceFieldException(
                            "academicYear",
                            "Đã tồn tại học phí cho sinh viên ở " + academicYear + " - học kỳ " + semester);
                }
                StudentTuition e = new StudentTuition();
                e.setUser(user);
                e.setTuitionRate(tuitionRate);
                e.setAcademicYear(academicYear);
                e.setSemester(semester);
                e.setTotalCredits(tuitionRate.getTrainingProgram().getTotalCredits());
                e.setAmountDue(installment);
                e.setAmountPaid(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
                e.setPaymentStatus("UNPAID");
                e.setNotes("Tự sinh từ kế hoạch 8 học kỳ (" + startYear + "-" + endYear + ")");
                toSave.add(e);
            }
        }
        if (!toSave.isEmpty()) {
            StudentTuition last = toSave.get(toSave.size() - 1);
            last.setAmountDue(last.getAmountDue().add(remainder).setScale(2, RoundingMode.HALF_UP));
        }
        List<StudentTuition> saved = studentTuitionRepository.saveAll(toSave);
        return saved.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentTuitionResponse> findMine(UUID userId) {
        return studentTuitionRepository.findAll(
                        StudentTuitionSpecifications.filter(null, userId, null, null, null),
                        org.springframework.data.domain.Sort.by(
                                org.springframework.data.domain.Sort.Order.asc("academicYear"),
                                org.springframework.data.domain.Sort.Order.asc("semester")))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public StudentTuitionPayResponse createPayment(
            Long studentTuitionId, UUID userId, StudentTuitionPayRequest request) {
        StudentTuition tuition = studentTuitionRepository.findById(studentTuitionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học phí sinh viên"));
        if (!tuition.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy học phí cần thanh toán");
        }
        String method = normalizePaymentMethod(request.getPaymentMethod());
        BigDecimal amount = validatePaymentAmount(tuition, request.getAmount());
        if (METHOD_MOMO.equals(method)) {
            return createMomoPayment(tuition, amount);
        }
        return createManualOrOfflinePayment(tuition, amount, method, request.getNote());
    }

    @Override
    @Transactional
    public List<StudentTuitionPaymentHistoryResponse> findPaymentHistoryForAdmin() {
        List<StudentTuitionPayment> payments = studentTuitionPaymentRepository.findByStatusOrderByCreatedAtDesc(PAYMENT_SUCCESS);
        return toPaymentHistoryResponses(payments, true);
    }

    @Override
    @Transactional
    public List<StudentTuitionPaymentHistoryResponse> findMyPaymentHistory(UUID userId, Long studentTuitionId) {
        List<StudentTuitionPayment> payments = studentTuitionId == null
                ? studentTuitionPaymentRepository.findByStudentTuition_User_IdOrderByCreatedAtDesc(userId)
                : studentTuitionPaymentRepository
                        .findByStudentTuition_IdAndStudentTuition_User_IdOrderByCreatedAtDesc(studentTuitionId, userId);
        return toPaymentHistoryResponses(payments, true);
    }

    private StudentTuitionPayResponse createMomoPayment(StudentTuition tuition, BigDecimal amount) {
        if (!momoProperties.isEnabled()) {
            throw new IllegalArgumentException("Thanh toán MoMo đang tắt cấu hình");
        }
        String orderId = "STTU-" + tuition.getId() + "-" + System.currentTimeMillis();
        String requestId = "REQ-" + UUID.randomUUID();
        String orderInfo = "Dong hoc phi ky " + tuition.getSemester() + " nam hoc " + tuition.getAcademicYear();
        String amountText = amount.setScale(0, RoundingMode.HALF_UP).toPlainString();
        String extraData = "";

        Map<String, Object> req = new LinkedHashMap<>();
        req.put("partnerCode", momoProperties.getPartnerCode());
        req.put("requestId", requestId);
        req.put("amount", amountText);
        req.put("orderId", orderId);
        req.put("orderInfo", orderInfo);
        req.put("redirectUrl", momoProperties.getRedirectUrl());
        req.put("ipnUrl", momoProperties.getIpnUrl());
        req.put("requestType", momoProperties.getRequestType());
        req.put("extraData", extraData);
        req.put("lang", momoProperties.getLang());

        String rawSignature = "accessKey=" + momoProperties.getAccessKey()
                + "&amount=" + amountText
                + "&extraData=" + extraData
                + "&ipnUrl=" + momoProperties.getIpnUrl()
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + momoProperties.getPartnerCode()
                + "&redirectUrl=" + momoProperties.getRedirectUrl()
                + "&requestId=" + requestId
                + "&requestType=" + momoProperties.getRequestType();
        req.put("signature", hmacSha256(rawSignature, momoProperties.getSecretKey()));

        @SuppressWarnings("unchecked")
        Map<String, Object> momoRes = restTemplate.postForObject(momoProperties.getEndpoint(), req, Map.class);
        if (momoRes == null) {
            throw new IllegalArgumentException("Không nhận được phản hồi từ MoMo");
        }
        Number resultCode = (Number) momoRes.getOrDefault("resultCode", -1);
        if (resultCode.intValue() != 0) {
            String message = String.valueOf(momoRes.getOrDefault("message", "Khởi tạo thanh toán MoMo thất bại"));
            throw new IllegalArgumentException(message);
        }

        StudentTuitionPayment payment = new StudentTuitionPayment();
        payment.setStudentTuition(tuition);
        payment.setProvider(METHOD_MOMO);
        payment.setStatus(PAYMENT_PENDING);
        payment.setAmount(amount);
        payment.setMomoOrderId(orderId);
        payment.setMomoRequestId(requestId);
        payment.setPayUrl(str(momoRes.get("payUrl")));
        payment.setDeeplink(str(momoRes.get("deeplink")));
        payment.setQrCodeUrl(str(momoRes.get("qrCodeUrl")));
        payment.setRawResponse(momoRes.toString());
        StudentTuitionPayment saved = studentTuitionPaymentRepository.save(payment);

        StudentTuitionPayResponse dto = new StudentTuitionPayResponse();
        dto.setPaymentId(saved.getId());
        dto.setStudentTuitionId(tuition.getId());
        dto.setAmount(amount);
        dto.setPaymentMethod(METHOD_MOMO);
        dto.setStatus(saved.getStatus());
        dto.setOrderId(orderId);
        dto.setRequestId(requestId);
        dto.setPayUrl(saved.getPayUrl());
        dto.setDeeplink(saved.getDeeplink());
        dto.setQrCodeUrl(saved.getQrCodeUrl());
        dto.setMessage("Đã tạo phiên thanh toán MoMo");
        return dto;
    }

    private StudentTuitionPayResponse createManualOrOfflinePayment(
            StudentTuition tuition,
            BigDecimal amount,
            String method,
            String note) {
        StudentTuitionPayment payment = new StudentTuitionPayment();
        payment.setStudentTuition(tuition);
        payment.setProvider(method);
        payment.setStatus(PAYMENT_SUCCESS);
        payment.setAmount(amount);
        payment.setRawResponse(trimToNull(note));
        StudentTuitionPayment saved = studentTuitionPaymentRepository.save(payment);

        applySuccessfulPayment(tuition, payment);
        StudentTuitionInvoice invoice = issueInvoiceForPayment(saved);

        StudentTuitionPayResponse dto = new StudentTuitionPayResponse();
        dto.setPaymentId(saved.getId());
        dto.setStudentTuitionId(tuition.getId());
        dto.setAmount(amount);
        dto.setPaymentMethod(method);
        dto.setStatus(PAYMENT_SUCCESS);
        dto.setMessage("Đã ghi nhận thanh toán thủ công");
        dto.setInvoiceId(invoice.getId());
        dto.setInvoiceNo(invoice.getInvoiceNo());
        dto.setInvoiceUrl("/api/v1/student-tuitions/mine/payments/" + saved.getId() + "/invoice-html");
        return dto;
    }

    @Override
    @Transactional
    public void handleMomoIpn(Map<String, Object> payload) {
        String orderId = str(payload.get("orderId"));
        if (orderId == null || orderId.isBlank()) return;

        String receivedSig = str(payload.get("signature"));
        if (receivedSig == null || receivedSig.isBlank()) return;

        TreeMap<String, String> sorted = new TreeMap<>();
        for (Map.Entry<String, Object> e : payload.entrySet()) {
            String k = e.getKey();
            if ("signature".equals(k) || "signType".equals(k)) continue;
            sorted.put(k, e.getValue() == null ? "" : String.valueOf(e.getValue()));
        }
        StringBuilder raw = new StringBuilder();
        boolean first = true;
        for (Map.Entry<String, String> e : sorted.entrySet()) {
            if (!first) raw.append("&");
            raw.append(e.getKey()).append("=").append(e.getValue());
            first = false;
        }
        String expected = hmacSha256(raw.toString(), momoProperties.getSecretKey());
        if (!expected.equals(receivedSig)) {
            return;
        }

        StudentTuitionPayment payment = studentTuitionPaymentRepository.findByMomoOrderId(orderId).orElse(null);
        if (payment == null) return;
        payment.setRawIpn(payload.toString());
        if (PAYMENT_SUCCESS.equalsIgnoreCase(payment.getStatus())) {
            studentTuitionPaymentRepository.save(payment);
            return;
        }

        int resultCode = Integer.parseInt(String.valueOf(payload.getOrDefault("resultCode", "-1")));
        if (resultCode != 0) {
            payment.setStatus(PAYMENT_FAILED);
            studentTuitionPaymentRepository.save(payment);
            return;
        }
        payment.setStatus(PAYMENT_SUCCESS);
        payment.setMomoTransId(str(payload.get("transId")));
        studentTuitionPaymentRepository.save(payment);
        applySuccessfulPayment(payment.getStudentTuition(), payment);
        issueInvoiceForPayment(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public String renderMyInvoiceHtml(Long paymentId, UUID userId) {
        StudentTuitionInvoice invoice = studentTuitionInvoiceRepository
                .findByPayment_IdAndPayment_StudentTuition_User_Id(paymentId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn"));
        return buildInvoiceHtml(invoice);
    }

    private void applySuccessfulPayment(StudentTuition tuition, StudentTuitionPayment payment) {
        BigDecimal newPaid = tuition.getAmountPaid().add(payment.getAmount()).setScale(2, RoundingMode.HALF_UP);
        if (newPaid.compareTo(tuition.getAmountDue()) > 0) {
            newPaid = tuition.getAmountDue();
        }
        tuition.setAmountPaid(newPaid);
        tuition.setPaymentStatus(derivePaymentStatus(tuition.getAmountDue(), newPaid));
        studentTuitionRepository.save(tuition);
    }

    private static String normalizePaymentMethod(String raw) {
        String method = raw == null ? "" : raw.trim().toUpperCase();
        if (method.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn phương thức thanh toán");
        }
        if (METHOD_MOMO.equals(method)
                || METHOD_MANUAL.equals(method)
                || METHOD_BANK_TRANSFER.equals(method)
                || METHOD_CARD.equals(method)) {
            return method;
        }
        throw new IllegalArgumentException("Phương thức thanh toán không hợp lệ");
    }

    private StudentTuitionInvoice issueInvoiceForPayment(StudentTuitionPayment payment) {
        return studentTuitionInvoiceRepository.findByPayment_Id(payment.getId())
                .orElseGet(() -> {
                    BigDecimal vatRate = invoiceProperties.getVatRate() == null
                            ? BigDecimal.ZERO
                            : invoiceProperties.getVatRate().max(BigDecimal.ZERO);
                    BigDecimal divisor = BigDecimal.ONE.add(vatRate);
                    BigDecimal beforeTax = divisor.compareTo(BigDecimal.ZERO) == 0
                            ? payment.getAmount()
                            : payment.getAmount().divide(divisor, 2, RoundingMode.HALF_UP);
                    BigDecimal vatAmount = payment.getAmount().subtract(beforeTax).setScale(2, RoundingMode.HALF_UP);

                    StudentTuitionInvoice inv = new StudentTuitionInvoice();
                    inv.setPayment(payment);
                    inv.setInvoiceNo(generateInvoiceNo(payment.getId()));
                    inv.setInvoiceSymbol(invoiceProperties.getSymbol());
                    inv.setSellerName(invoiceProperties.getSellerName());
                    inv.setSellerTaxCode(invoiceProperties.getSellerTaxCode());
                    inv.setSellerAddress(invoiceProperties.getSellerAddress());
                    String buyerFull = payment.getStudentTuition().getUser().getFullName();
                    if (buyerFull == null || buyerFull.isBlank()) {
                        buyerFull = payment.getStudentTuition().getUser().getUsername();
                    }
                    if (buyerFull == null || buyerFull.isBlank()) {
                        buyerFull = "Sinh viên";
                    }
                    inv.setBuyerName(buyerFull);
                    inv.setDescription("Thu học phí kỳ " + payment.getStudentTuition().getSemester()
                            + " năm học " + payment.getStudentTuition().getAcademicYear());
                    inv.setAmountBeforeTax(beforeTax);
                    inv.setVatRate(vatRate);
                    inv.setVatAmount(vatAmount);
                    inv.setTotalAmount(payment.getAmount().setScale(2, RoundingMode.HALF_UP));
                    inv.setStatus("ISSUED");
                    return studentTuitionInvoiceRepository.save(inv);
                });
    }

    private static String generateInvoiceNo(Long paymentId) {
        String date = java.time.LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        return "INV-" + date + "-" + String.format("%06d", paymentId);
    }

    private static String esc(String value) {
        if (value == null) return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private static String vnMoney(BigDecimal amount) {
        DecimalFormat f = new DecimalFormat("#,##0.00");
        return f.format(amount) + " VND";
    }

    private String buildInvoiceHtml(StudentTuitionInvoice invoice) {
        String issueTime = invoice.getCreatedAt() == null
                ? ""
                : DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
                        .withZone(ZoneId.systemDefault())
                        .format(invoice.getCreatedAt());
        String vatPct = invoice.getVatRate()
                .multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .toPlainString();
        return ("<!doctype html>\n"
                + "<html lang=\"vi\">\n"
                + "<head>\n"
                + "  <meta charset=\"utf-8\"/>\n"
                + "  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/>\n"
                + "  <title>H\u00f3a \u0111\u01a1n " + esc(invoice.getInvoiceNo()) + "</title>\n"
                + "  <style>\n"
                + "    @media print { .no-print { display: none !important; } }\n"
                + "    * { box-sizing: border-box; }\n"
                + "    body { font-family: 'Times New Roman', Times, serif; background: #f5f5f5; margin: 0; padding: 20px; }\n"
                + "    .page { max-width: 800px; margin: 0 auto; background: #fff; border: 1px solid #ccc;\n"
                + "            padding: 32px 40px; position: relative; }\n"
                + "    .red-border { border: 3px solid #c0392b; padding: 28px 32px; }\n"
                + "    .print-btn { position: absolute; top: 12px; right: 12px;\n"
                + "      background: #c0392b; color: #fff; border: none; border-radius: 6px;\n"
                + "      padding: 8px 18px; font-size: 14px; cursor: pointer; font-family: Arial, sans-serif; }\n"
                + "    .print-btn:hover { background: #922b21; }\n"
                + "    .center { text-align: center; }\n"
                + "    h2 { color: #c0392b; font-size: 20px; margin: 0 0 2px; text-transform: uppercase; letter-spacing: 1px; }\n"
                + "    .subtitle { font-size: 13px; color: #555; margin-bottom: 18px; }\n"
                + "    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px;\n"
                + "                 font-size: 13px; margin-bottom: 16px; border-bottom: 1px solid #e0e0e0; padding-bottom: 12px; }\n"
                + "    .meta-grid .label { color: #555; }\n"
                + "    .section-title { font-weight: bold; font-size: 13px; margin: 12px 0 4px; color: #c0392b; }\n"
                + "    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 4px; }\n"
                + "    th { background: #fdf2f2; color: #333; border: 1px solid #d0b0b0; padding: 7px 10px; }\n"
                + "    td { border: 1px solid #e0c0c0; padding: 7px 10px; }\n"
                + "    .right { text-align: right; }\n"
                + "    .total-row td { font-weight: bold; background: #fdf2f2; }\n"
                + "    .footer { margin-top: 24px; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; padding-top: 10px; }\n"
                + "    .sig-row { display: flex; justify-content: space-between; margin-top: 32px; font-size: 13px; text-align: center; }\n"
                + "    .sig-box { width: 180px; }\n"
                + "    .sig-box p { margin: 0 0 4px; font-weight: bold; }\n"
                + "    .sig-box small { color: #888; font-size: 11px; }\n"
                + "  </style>\n"
                + "</head>\n"
                + "<body>\n"
                + "<div class=\"page\">\n"
                + "  <button class=\"print-btn no-print\" onclick=\"window.print()\">&#128438; In / T\u1ea3i PDF</button>\n"
                + "  <div class=\"red-border\">\n"
                + "    <div class=\"center\">\n"
                + "      <h2>H\u00f3a \u0111\u01a1n gi\u00e1 tr\u1ecb gia t\u0103ng</h2>\n"
                + "      <div class=\"subtitle\">Li\u00ean 2: Giao kh\u00e1ch h\u00e0ng</div>\n"
                + "    </div>\n"
                + "    <div class=\"meta-grid\">\n"
                + "      <div><span class=\"label\">K\u00fd hi\u1ec7u:</span> <b>" + esc(invoice.getInvoiceSymbol()) + "</b></div>\n"
                + "      <div><span class=\"label\">S\u1ed1 h\u00f3a \u0111\u01a1n:</span> <b>" + esc(invoice.getInvoiceNo()) + "</b></div>\n"
                + "      <div><span class=\"label\">Ng\u00e0y l\u1eadp:</span> <b>" + esc(issueTime) + "</b></div>\n"
                + "    </div>\n"
                + "    <div class=\"section-title\">\u0110\u01a1n v\u1ecb b\u00e1n h\u00e0ng</div>\n"
                + "    <div style=\"font-size:13px;\">\n"
                + "      <div><b>" + esc(invoice.getSellerName()) + "</b></div>\n"
                + "      <div>M\u00e3 s\u1ed1 thu\u1ebf: " + esc(invoice.getSellerTaxCode()) + "</div>\n"
                + "      <div>\u0110\u1ecba ch\u1ec9: " + esc(invoice.getSellerAddress()) + "</div>\n"
                + "    </div>\n"
                + "    <div class=\"section-title\">Ng\u01b0\u1eddi mua h\u00e0ng</div>\n"
                + "    <div style=\"font-size:13px;\">\n"
                + "      <div><b>" + esc(invoice.getBuyerName()) + "</b></div>\n"
                + "    </div>\n"
                + "    <div class=\"section-title\">N\u1ed9i dung d\u1ecbch v\u1ee5</div>\n"
                + "    <table>\n"
                + "      <thead>\n"
                + "        <tr>\n"
                + "          <th>Di\u1ec5n gi\u1ea3i</th>\n"
                + "          <th class=\"right\">Ti\u1ec1n tr\u01b0\u1edbc thu\u1ebf</th>\n"
                + "          <th class=\"right\">Thu\u1ebf su\u1ea5t GTGT</th>\n"
                + "          <th class=\"right\">Ti\u1ec1n thu\u1ebf GTGT</th>\n"
                + "          <th class=\"right\">Th\u00e0nh ti\u1ec1n</th>\n"
                + "        </tr>\n"
                + "      </thead>\n"
                + "      <tbody>\n"
                + "        <tr>\n"
                + "          <td>" + esc(invoice.getDescription()) + "</td>\n"
                + "          <td class=\"right\">" + esc(vnMoney(invoice.getAmountBeforeTax())) + "</td>\n"
                + "          <td class=\"right\">" + vatPct + "%</td>\n"
                + "          <td class=\"right\">" + esc(vnMoney(invoice.getVatAmount())) + "</td>\n"
                + "          <td class=\"right\">" + esc(vnMoney(invoice.getTotalAmount())) + "</td>\n"
                + "        </tr>\n"
                + "        <tr class=\"total-row\">\n"
                + "          <td colspan=\"3\">C\u1ed9ng ti\u1ec1n thanh to\u00e1n</td>\n"
                + "          <td></td>\n"
                + "          <td class=\"right\">" + esc(vnMoney(invoice.getTotalAmount())) + "</td>\n"
                + "        </tr>\n"
                + "      </tbody>\n"
                + "    </table>\n"
                + "    <div class=\"sig-row no-print\">\n"
                + "      <div class=\"sig-box\"><p>Ng\u01b0\u1eddi mua h\u00e0ng</p><small>(K\u00fd, ghi r\u00f5 h\u1ecd t\u00ean)</small><br/><br/><br/></div>\n"
                + "      <div class=\"sig-box\"><p>Ng\u01b0\u1eddi b\u00e1n h\u00e0ng</p><small>(K\u00fd, \u0111\u00f3ng d\u1ea5u, ghi r\u00f5 h\u1ecd t\u00ean)</small><br/><br/><br/></div>\n"
                + "    </div>\n"
                + "    <div class=\"footer\">\n"
                + "      \u0110\u00e2y l\u00e0 m\u1eabu h\u00f3a \u0111\u01a1n \u0111i\u1ec7n t\u1eed h\u1ecdc ph\u00ed. \u0110\u1ec3 c\u00f3 h\u00f3a \u0111\u01a1n h\u1ee3p l\u1ec7 theo Ngh\u1ecb \u0111\u1ecbnh 123/2020/N\u0110-CP "
                + "(c\u00f3 m\u00e3 c\u1ee7a C\u01a1 quan Thu\u1ebf, ch\u1eef k\u00fd s\u1ed1), vui l\u00f2ng li\u00ean h\u1ec7 ph\u00f2ng k\u1ebf to\u00e1n.\n"
                + "    </div>\n"
                + "  </div>\n"
                + "</div>\n"
                + "</body>\n"
                + "</html>\n");
    }

    private static BigDecimal validatePaymentAmount(StudentTuition tuition, BigDecimal rawAmount) {
        BigDecimal remaining = tuition.getAmountDue().subtract(tuition.getAmountPaid()).setScale(2, RoundingMode.HALF_UP);
        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Học phí học kỳ này đã đóng đủ");
        }
        BigDecimal amount = rawAmount.setScale(2, RoundingMode.HALF_UP);
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền thanh toán phải lớn hơn 0");
        }
        if (amount.compareTo(remaining) > 0) {
            throw new IllegalArgumentException("Số tiền thanh toán vượt quá số còn phải đóng");
        }
        return amount;
    }

    private TuitionRate resolveTuitionRate(Long tuitionRateId) {
        if (tuitionRateId == null) return null;
        return tuitionRateRepository.findById(tuitionRateId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mức học phí"));
    }

    private static String normalize(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private static String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    private static String hmacSha256(String data, String key) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA256");
            hmac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(digest);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Không thể tạo chữ ký MoMo", ex);
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(Character.forDigit((b >>> 4) & 0xF, 16));
            sb.append(Character.forDigit((b & 0xF), 16));
        }
        return sb.toString();
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private static String derivePaymentStatus(BigDecimal amountDue, BigDecimal amountPaid) {
        if (amountPaid == null || amountPaid.compareTo(BigDecimal.ZERO) <= 0) {
            return "UNPAID";
        }
        if (amountPaid.compareTo(amountDue) >= 0) {
            return "PAID";
        }
        return "PARTIAL";
    }

    private static void apply(
            StudentTuition e,
            String academicYear,
            Integer semester,
            Integer totalCredits,
            BigDecimal amountDue,
            BigDecimal amountPaid,
            String notes) {
        if (amountPaid.compareTo(amountDue) > 0) {
            throw new IllegalArgumentException("Số tiền đã đóng không được lớn hơn số tiền phải đóng");
        }
        e.setAcademicYear(academicYear);
        e.setSemester(semester);
        e.setTotalCredits(totalCredits);
        e.setAmountDue(amountDue);
        e.setAmountPaid(amountPaid);
        e.setPaymentStatus(derivePaymentStatus(amountDue, amountPaid));
        e.setNotes(trimToNull(notes));
    }

    private StudentTuitionResponse toResponse(StudentTuition e) {
        StudentTuitionResponse dto = new StudentTuitionResponse();
        dto.setId(e.getId());
        dto.setUserId(e.getUser().getId());
        dto.setUserFullName(e.getUser().getFullName());
        if (e.getTuitionRate() != null) {
            dto.setTuitionRateId(e.getTuitionRate().getId());
            dto.setTuitionRateName(e.getTuitionRate().getTuitionName());
        }
        dto.setAcademicYear(e.getAcademicYear());
        dto.setSemester(e.getSemester());
        dto.setTotalCredits(e.getTotalCredits());
        dto.setAmountDue(e.getAmountDue());
        dto.setAmountPaid(e.getAmountPaid());
        dto.setPaymentStatus(e.getPaymentStatus());
        dto.setNotes(e.getNotes());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }

    private static StudentTuitionPaymentHistoryResponse toPaymentHistoryResponse(
            StudentTuitionPayment payment, StudentTuitionInvoice invoice) {
        StudentTuitionPaymentHistoryResponse dto = new StudentTuitionPaymentHistoryResponse();
        dto.setPaymentId(payment.getId());
        dto.setStudentTuitionId(payment.getStudentTuition().getId());
        dto.setUserId(payment.getStudentTuition().getUser().getId());
        dto.setUserFullName(payment.getStudentTuition().getUser().getFullName());
        dto.setAcademicYear(payment.getStudentTuition().getAcademicYear());
        dto.setSemester(payment.getStudentTuition().getSemester());
        dto.setAmount(payment.getAmount());
        dto.setPaymentMethod(payment.getProvider());
        dto.setStatus(payment.getStatus());
        dto.setInvoiceId(invoice == null ? null : invoice.getId());
        dto.setInvoiceNo(invoice == null ? null : invoice.getInvoiceNo());
        dto.setCreatedAt(payment.getCreatedAt());
        return dto;
    }

    private List<StudentTuitionPaymentHistoryResponse> toPaymentHistoryResponses(
            List<StudentTuitionPayment> payments,
            boolean ensureInvoiceForSuccess) {
        if (payments.isEmpty()) {
            return List.of();
        }

        List<Long> paymentIds = payments.stream().map(StudentTuitionPayment::getId).toList();
        Map<Long, StudentTuitionInvoice> invoiceByPaymentId = new HashMap<>();
        for (StudentTuitionInvoice invoice : studentTuitionInvoiceRepository.findByPayment_IdIn(paymentIds)) {
            invoiceByPaymentId.put(invoice.getPayment().getId(), invoice);
        }
        if (ensureInvoiceForSuccess) {
            for (StudentTuitionPayment payment : payments) {
                if (!PAYMENT_SUCCESS.equalsIgnoreCase(payment.getStatus())) {
                    continue;
                }
                if (invoiceByPaymentId.containsKey(payment.getId())) {
                    continue;
                }
                StudentTuitionInvoice created = issueInvoiceForPayment(payment);
                invoiceByPaymentId.put(payment.getId(), created);
            }
        }
        return payments.stream()
                .map(payment -> toPaymentHistoryResponse(payment, invoiceByPaymentId.get(payment.getId())))
                .sorted(Comparator.comparing(StudentTuitionPaymentHistoryResponse::getCreatedAt).reversed())
                .toList();
    }
}
