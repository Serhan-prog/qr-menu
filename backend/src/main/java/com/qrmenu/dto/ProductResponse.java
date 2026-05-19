package com.qrmenu.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record ProductResponse(
        Long id,
        Long restaurantId,
        Long categoryId,
        String categoryName,
        String name,
        String description,
        BigDecimal price,
        String imageUrl,
        boolean available,
        Integer sortOrder,
        Instant createdAt,
        Instant updatedAt
) {
}
