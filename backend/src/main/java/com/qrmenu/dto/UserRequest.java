package com.qrmenu.dto;

import com.qrmenu.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserRequest(
        @NotNull Long restaurantId,
        @NotBlank @Email @Size(max = 120) String email,
        @NotBlank @Size(max = 160) String fullName,
        @NotBlank String password,
        UserRole role,
        Boolean active
) {
}
