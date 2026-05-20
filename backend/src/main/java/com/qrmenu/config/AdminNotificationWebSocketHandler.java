package com.qrmenu.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.qrmenu.dto.AdminNotification;
import com.qrmenu.service.WebSocketTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class AdminNotificationWebSocketHandler extends TextWebSocketHandler {
    private static final String RESTAURANT_ID_ATTRIBUTE = "restaurantId";

    private final ObjectMapper objectMapper;
    private final WebSocketTicketService webSocketTicketService;
    private final Map<Long, Set<WebSocketSession>> sessionsByRestaurant = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        try {
            URI uri = session.getUri();
            var params = UriComponentsBuilder.fromUri(uri).build().getQueryParams();
            String ticket = params.getFirst("ticket");

            if (ticket == null) {
                session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Missing websocket ticket"));
                return;
            }

            Long restaurantId = webSocketTicketService.consume(ticket);

            session.getAttributes().put(RESTAURANT_ID_ATTRIBUTE, restaurantId);
            sessionsByRestaurant.computeIfAbsent(restaurantId, ignored -> ConcurrentHashMap.newKeySet()).add(session);
        } catch (Exception ex) {
            session.close(CloseStatus.POLICY_VIOLATION.withReason("Invalid websocket authentication"));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long restaurantId = (Long) session.getAttributes().get(RESTAURANT_ID_ATTRIBUTE);
        if (restaurantId == null) {
            return;
        }
        Set<WebSocketSession> sessions = sessionsByRestaurant.get(restaurantId);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                sessionsByRestaurant.remove(restaurantId);
            }
        }
    }

    public void sendToRestaurant(Long restaurantId, AdminNotification notification) {
        Set<WebSocketSession> sessions = sessionsByRestaurant.getOrDefault(restaurantId, Set.of());
        if (sessions.isEmpty()) {
            return;
        }

        try {
            TextMessage message = new TextMessage(objectMapper.writeValueAsString(notification));
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    session.sendMessage(message);
                }
            }
        } catch (Exception ignored) {
            // Notification delivery must not break order/request creation.
        }
    }
}
