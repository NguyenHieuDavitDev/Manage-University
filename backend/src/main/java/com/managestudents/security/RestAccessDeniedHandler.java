package com.managestudents.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.managestudents.common.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;

@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public RestAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException)
            throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiErrorResponse body = new ApiErrorResponse();
        body.setTimestamp(Instant.now());
        body.setStatus(HttpStatus.FORBIDDEN.value());
        body.setError(HttpStatus.FORBIDDEN.getReasonPhrase());
        body.setMessage("Không có quyền truy cập");
        body.setPath(request.getRequestURI());
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
