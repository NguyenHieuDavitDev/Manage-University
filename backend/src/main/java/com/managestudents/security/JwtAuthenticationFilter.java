package com.managestudents.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.managestudents.common.dto.ApiErrorResponse;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    public JwtAuthenticationFilter(JwtService jwtService, ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        if (isPublicApiPath(request)) {
            filterChain.doFilter(request, response);
            return;
        }
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        String raw = header.substring(7).trim();
        if (raw.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }
        try {
            Claims claims = jwtService.parseAndValidate(raw);
            UUID userId = jwtService.extractUserId(claims);
            String username = claims.get("username", String.class);
            List<String> roleCodes = jwtService.extractRoleCodes(claims);
            List<SimpleGrantedAuthority> authorities = roleCodes.stream()
                    .map(rc -> new SimpleGrantedAuthority("ROLE_" + rc.toUpperCase().replace('-', '_')))
                    .collect(Collectors.toList());
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                            new JwtPrincipal(userId, username, roleCodes),
                            null,
                            authorities);
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (JwtException ex) {
            SecurityContextHolder.clearContext();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            ApiErrorResponse body = new ApiErrorResponse();
            body.setTimestamp(Instant.now());
            body.setStatus(HttpStatus.UNAUTHORIZED.value());
            body.setError(HttpStatus.UNAUTHORIZED.getReasonPhrase());
            body.setMessage("Token không hợp lệ hoặc đã hết hạn");
            body.setPath(request.getRequestURI());
            objectMapper.writeValue(response.getOutputStream(), body);
            return;
        }
        filterChain.doFilter(request, response);
    }

    private static boolean isPublicApiPath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String method = request.getMethod();
        if (!uri.startsWith("/api/v1/")) {
            return true;
        }
        if (uri.startsWith("/api/v1/auth/")) {
            return true;
        }
        if (uri.startsWith("/api/v1/files/avatars")) {
            return "GET".equalsIgnoreCase(method) || "POST".equalsIgnoreCase(method);
        }
        if (uri.startsWith("/api/v1/files/credentials") && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        if (uri.startsWith("/api/v1/files/insurances") && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        if (uri.startsWith("/api/v1/files/labor-contracts") && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        if (uri.startsWith("/api/v1/files/research-works") && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        return false;
    }
}
