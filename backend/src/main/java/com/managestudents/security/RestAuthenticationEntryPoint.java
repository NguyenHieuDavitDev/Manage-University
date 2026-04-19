package com.managestudents.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.managestudents.common.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public RestAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiErrorResponse body = new ApiErrorResponse();
        body.setTimestamp(Instant.now());
        body.setStatus(HttpStatus.UNAUTHORIZED.value());
        body.setError(HttpStatus.UNAUTHORIZED.getReasonPhrase());
        body.setMessage("Cần đăng nhập (JWT Bearer)");
        body.setPath(request.getRequestURI());
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
