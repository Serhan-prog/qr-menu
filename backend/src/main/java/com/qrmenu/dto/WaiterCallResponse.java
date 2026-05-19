package com.qrmenu.dto;

import com.qrmenu.entity.WaiterCallStatus;

import java.time.Instant;

public record WaiterCallResponse(
        Long id,
        Long restaurantId,
        Long tableId,
        Integer tableNumber,
        String tableCode,
        WaiterCallStatus status,
        String message,
        Instant createdAt,
        Instant updatedAt
) {
}
