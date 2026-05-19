package com.qrmenu.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductRequest(
        @NotNull Long restaurantId,
        @NotNull Long categoryId,
        @NotBlank @Size(max = 160) String name,
        @Size(max = 1000) String description,
        @NotNull @DecimalMin(value = "0.00", inclusive = false) BigDecimal price,
        @Size(max = 700) String imageUrl,
        Boolean available,
        Integer sortOrder
) {
}
