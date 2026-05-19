package com.qrmenu.dto;

import com.qrmenu.entity.WaiterCallStatus;
import jakarta.validation.constraints.NotNull;

public record WaiterCallStatusUpdateRequest(@NotNull WaiterCallStatus status) {
}
