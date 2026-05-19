package com.qrmenu.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record OrderItemRequest(
        @NotNull Long productId,
        @NotNull @Positive Integer quantity,
        @Size(max = 500) String note
) {
}
