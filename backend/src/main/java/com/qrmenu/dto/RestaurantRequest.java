package com.qrmenu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RestaurantRequest(
        @NotBlank @Size(max = 160) String name,
        @Size(max = 500) String address,
        @Size(max = 40) String phone,
        Boolean active
) {
}
