package com.qrmenu.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record OrderCreateRequest(
        @NotBlank String tableCode,
        @Size(max = 1000) String note,
        @NotEmpty List<@Valid OrderItemRequest> items
) {
}
