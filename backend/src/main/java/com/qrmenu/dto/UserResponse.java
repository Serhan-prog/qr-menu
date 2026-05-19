package com.qrmenu.dto;

import com.qrmenu.entity.UserRole;

import java.time.Instant;

public record UserResponse(
        Long id,
        Long restaurantId,
        String email,
        String fullName,
        UserRole role,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
