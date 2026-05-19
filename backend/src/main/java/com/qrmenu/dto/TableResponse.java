package com.qrmenu.dto;

import java.time.Instant;

public record TableResponse(
        Long id,
        Long restaurantId,
        Integer tableNumber,
        String tableCode,
        String qrUrl,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
