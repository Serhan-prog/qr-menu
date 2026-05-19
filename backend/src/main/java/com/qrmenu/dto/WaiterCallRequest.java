package com.qrmenu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WaiterCallRequest(
        @NotBlank String tableCode,
        @Size(max = 500) String message
) {
}
