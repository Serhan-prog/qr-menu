package com.qrmenu.dto;

import com.qrmenu.entity.BillRequestStatus;

import java.time.Instant;

public record BillRequestResponse(
        Long id,
        Long restaurantId,
        Long tableId,
        Integer tableNumber,
        String tableCode,
        BillRequestStatus status,
        String note,
        Instant createdAt,
        Instant updatedAt
) {
}
