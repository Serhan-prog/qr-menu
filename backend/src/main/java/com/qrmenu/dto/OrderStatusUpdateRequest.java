package com.qrmenu.dto;

import com.qrmenu.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record OrderStatusUpdateRequest(
        @NotNull OrderStatus status,
        @Size(max = 500) String cancellationReason
) {
}
