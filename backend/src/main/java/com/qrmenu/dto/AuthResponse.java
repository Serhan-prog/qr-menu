package com.qrmenu.dto;

import com.qrmenu.entity.UserRole;

public record AuthResponse(
        String token,
        String tokenType,
        Long userId,
        Long restaurantId,
        String email,
        String fullName,
        UserRole role
) {
}
