package com.qrmenu.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record TableRequest(
        @NotNull Long restaurantId,
        @NotNull @Positive Integer tableNumber,
        Boolean active
) {
}
