package com.qrmenu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BillRequestRequest(
        @NotBlank String tableCode,
        @Size(max = 500) String note
) {
}
