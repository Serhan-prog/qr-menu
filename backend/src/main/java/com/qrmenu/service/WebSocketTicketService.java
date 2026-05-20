package com.qrmenu.service;

import com.qrmenu.dto.WebSocketTicketResponse;
import com.qrmenu.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class WebSocketTicketService {
    private static final long TICKET_TTL_SECONDS = 30;

    private final AuthContextService authContextService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, Ticket> tickets = new ConcurrentHashMap<>();

    public WebSocketTicketResponse issue() {
        cleanupExpiredTickets();

        Long restaurantId = authContextService.currentRestaurantId();
        Instant expiresAt = Instant.now().plusSeconds(TICKET_TTL_SECONDS);
        String ticket = newTicket();
        tickets.put(ticket, new Ticket(restaurantId, expiresAt));
        return new WebSocketTicketResponse(ticket, expiresAt);
    }

    public Long consume(String ticket) {
        if (ticket == null || ticket.isBlank()) {
            throw new BadRequestException("WebSocket ticket is required");
        }

        Ticket storedTicket = tickets.remove(ticket);
        if (storedTicket == null || storedTicket.expiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("WebSocket ticket is invalid or expired");
        }
        return storedTicket.restaurantId();
    }

    private String newTicket() {
        String ticket;
        do {
            byte[] bytes = new byte[32];
            secureRandom.nextBytes(bytes);
            ticket = HexFormat.of().formatHex(bytes);
        } while (tickets.containsKey(ticket));
        return ticket;
    }

    private void cleanupExpiredTickets() {
        Instant now = Instant.now();
        tickets.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
    }

    private record Ticket(Long restaurantId, Instant expiresAt) {
    }
}
