package com.managestudents.common.exception;

/**
 * Lỗi 404 cho tài nguyên không tồn tại (HR, danh mục, v.v.).
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
