package com.qrmenu.dto;

import com.qrmenu.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        Long restaurantId,
        Long tableId,
        Integer tableNumber,
        String tableCode,
        OrderStatus status,
        String note,
        BigDecimal totalAmount,
        List<OrderItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {
}
