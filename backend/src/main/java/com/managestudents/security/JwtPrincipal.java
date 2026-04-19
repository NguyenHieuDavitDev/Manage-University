package com.managestudents.security;

import java.util.List;
import java.util.UUID;

public record JwtPrincipal(UUID userId, String username, List<String> roleCodes) {
}
