package com.qrmenu.dto;

import java.time.Instant;

public record AdminNotification(
        String type,
        Long restaurantId,
        Long tableId,
        Integer tableNumber,
        Long entityId,
        String title,
        String message,
        Instant createdAt
) {
}
