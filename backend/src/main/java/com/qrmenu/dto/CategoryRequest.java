package com.qrmenu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotNull Long restaurantId,
        @NotBlank @Size(max = 120) String name,
        @Size(max = 500) String description,
        Integer sortOrder,
        Boolean active
) {
}
