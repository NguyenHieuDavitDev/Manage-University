package com.managestudents.common.exception;

/**
 * Lỗi 409 khi trùng trường unique (mã, số hợp đồng theo user, v.v.).
 */
public class DuplicateResourceFieldException extends RuntimeException {

    private final String field;

    public DuplicateResourceFieldException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
