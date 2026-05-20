package com.qrmenu.dto;

import java.time.Instant;

public record WebSocketTicketResponse(
        String ticket,
        Instant expiresAt
) {
}
