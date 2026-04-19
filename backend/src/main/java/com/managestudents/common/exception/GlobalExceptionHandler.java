package com.managestudents.common.exception;

import com.managestudents.common.dto.ApiErrorResponse;
import com.managestudents.permission.service.DuplicatePermissionFieldException;
import com.managestudents.permission.service.PermissionNotFoundException;
import com.managestudents.role.service.DuplicateRoleFieldException;
import com.managestudents.role.service.RoleNotFoundException;
import com.managestudents.user.service.DuplicateUserFieldException;
import com.managestudents.user.service.UserNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleResourceNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {
        ApiErrorResponse body = base(HttpStatus.NOT_FOUND, ex.getMessage(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(DuplicateResourceFieldException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicateResourceField(
            DuplicateResourceFieldException ex, HttpServletRequest request) {
        ApiErrorResponse body = base(HttpStatus.CONFLICT, ex.getMessage(), request.getRequestURI());
        Map<String, String> details = new HashMap<>();
        details.put(ex.getField(), "Đã tồn tại");
        body.setDetails(details);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(RoleNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleRoleNotFound(
            RoleNotFoundException ex, HttpServletRequest request) {
        ApiErrorResponse body = base(HttpStatus.NOT_FOUND, ex.getMessage(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(DuplicateRoleFieldException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicateRole(
            DuplicateRoleFieldException ex, HttpServletRequest request) {
        ApiErrorResponse body = base(HttpStatus.CONFLICT, ex.getMessage(), request.getRequestURI());
        Map<String, String> details = new HashMap<>();
        details.put(ex.getField(), "Đã tồn tại");
        body.setDetails(details);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(PermissionNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handlePermissionNotFound(
            PermissionNotFoundException ex, HttpServletRequest request) {
        ApiErrorResponse body = base(HttpStatus.NOT_FOUND, ex.getMessage(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(DuplicatePermissionFieldException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicatePermission(
            DuplicatePermissionFieldException ex, HttpServletRequest request) {
        ApiErrorResponse body = base(HttpStatus.CONFLICT, ex.getMessage(), request.getRequestURI());
        Map<String, String> details = new HashMap<>();
        details.put(ex.getField(), "Đã tồn tại");
        body.setDetails(details);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleUserNotFound(
            UserNotFoundException ex, HttpServletRequest request) {
        ApiErrorResponse body = base(HttpStatus.NOT_FOUND, ex.getMessage(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(DuplicateUserFieldException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicateUser(
            DuplicateUserFieldException ex, HttpServletRequest request) {
        ApiErrorResponse body = base(HttpStatus.CONFLICT, ex.getMessage(), request.getRequestURI());
        Map<String, String> details = new HashMap<>();
        details.put(ex.getField(), "Đã tồn tại");
        body.setDetails(details);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest request) {
        ApiErrorResponse body = base(HttpStatus.BAD_REQUEST, ex.getMessage(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentials(
            BadCredentialsException ex, HttpServletRequest request) {
        ApiErrorResponse body = base(HttpStatus.UNAUTHORIZED, ex.getMessage(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {
        ApiErrorResponse body = base(HttpStatus.FORBIDDEN, "Không có quyền truy cập", request.getRequestURI());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadableJson(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        ApiErrorResponse body = base(
                HttpStatus.BAD_REQUEST,
                "JSON không hợp lệ hoặc kiểu dữ liệu không đúng (ví dụ ngày sinh, trạng thái).",
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingParam(
            MissingServletRequestParameterException ex, HttpServletRequest request) {
        ApiErrorResponse body = base(
                HttpStatus.BAD_REQUEST,
                "Thiếu tham số: " + ex.getParameterName(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String msg = "Tham số không hợp lệ";
        if (ex.getName() != null && ex.getValue() != null) {
            msg = "Tham số '" + ex.getName() + "' không hợp lệ: " + ex.getValue();
        }
        ApiErrorResponse body = base(HttpStatus.BAD_REQUEST, msg, request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleUploadTooLarge(
            MaxUploadSizeExceededException ex, HttpServletRequest request) {
        ApiErrorResponse body = base(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "File tải lên vượt quá dung lượng cho phép (tối đa 2MB).",
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(body);
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ApiErrorResponse> handleMultipart(
            MultipartException ex, HttpServletRequest request) {
        ApiErrorResponse body = base(
                HttpStatus.BAD_REQUEST,
                "Lỗi multipart: " + ex.getMessage(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrity(
            DataIntegrityViolationException ex, HttpServletRequest request) {
        ApiErrorResponse body = base(
                HttpStatus.CONFLICT,
                "Vi phạm ràng buộc dữ liệu (khóa ngoại hoặc unique). Kiểm tra lại vai trò và các trường trùng.",
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(java.io.FileNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleFileNotFound(
            java.io.FileNotFoundException ex, HttpServletRequest request) {
        ApiErrorResponse body = base(HttpStatus.NOT_FOUND, "Không tìm thấy file.", request.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage, (a, b) -> a));
        ApiErrorResponse body = base(HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ", request.getRequestURI());
        body.setDetails(fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    private static ApiErrorResponse base(HttpStatus status, String message, String path) {
        ApiErrorResponse r = new ApiErrorResponse();
        r.setTimestamp(Instant.now());
        r.setStatus(status.value());
        r.setError(status.getReasonPhrase());
        r.setMessage(message);
        r.setPath(path);
        return r;
    }
}
