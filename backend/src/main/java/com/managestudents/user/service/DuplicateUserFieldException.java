package com.managestudents.user.service;

public class DuplicateUserFieldException extends RuntimeException {

    private final String field;
    private final String value;

    public DuplicateUserFieldException(String field, String value) {
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
