package com.managestudents.permission.service;

public class DuplicatePermissionFieldException extends RuntimeException {

    private final String field;
    private final String value;

    public DuplicatePermissionFieldException(String field, String value) {
        super("Giá trị đã tồn tại: " + field + " = " + value);
        this.field = field;
        this.value = value;
    }

    public String getField() {
        return field;
    }

    public String getValue() {
        return value;
    }
}
