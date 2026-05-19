package com.qrmenu.dto;

import java.time.Instant;

public record CategoryResponse(
        Long id,
        Long restaurantId,
        String name,
        String description,
        Integer sortOrder,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
