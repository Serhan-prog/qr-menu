package com.qrmenu.dto;

import com.qrmenu.entity.BillRequestStatus;
import jakarta.validation.constraints.NotNull;

public record BillRequestStatusUpdateRequest(@NotNull BillRequestStatus status) {
}
