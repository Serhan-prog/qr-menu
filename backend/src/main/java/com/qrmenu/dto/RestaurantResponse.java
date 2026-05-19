package com.qrmenu.dto;

import java.time.Instant;

public record RestaurantResponse(
        Long id,
        String name,
        String address,
        String phone,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
