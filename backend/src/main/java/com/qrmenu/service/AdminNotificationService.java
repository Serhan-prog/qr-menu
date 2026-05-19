package com.qrmenu.service;

import com.qrmenu.config.AdminNotificationWebSocketHandler;
import com.qrmenu.dto.AdminNotification;
import com.qrmenu.dto.BillRequestResponse;
import com.qrmenu.dto.OrderResponse;
import com.qrmenu.dto.WaiterCallResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AdminNotificationService {
    private final AdminNotificationWebSocketHandler webSocketHandler;

    public void orderCreated(OrderResponse order) {
        publish(new AdminNotification(
                "ORDER_CREATED",
                order.restaurantId(),
                order.tableId(),
                order.tableNumber(),
                order.id(),
                "Yeni sipariş",
                "Masa " + order.tableNumber() + " yeni sipariş verdi.",
                Instant.now()
        ));
    }

    public void waiterCallCreated(WaiterCallResponse waiterCall) {
        publish(new AdminNotification(
                "WAITER_CALL_CREATED",
                waiterCall.restaurantId(),
                waiterCall.tableId(),
                waiterCall.tableNumber(),
                waiterCall.id(),
                "Garson çağrısı",
                "Masa " + waiterCall.tableNumber() + " garson çağırdı.",
                Instant.now()
        ));
    }

    public void billRequestCreated(BillRequestResponse billRequest) {
        publish(new AdminNotification(
                "BILL_REQUEST_CREATED",
                billRequest.restaurantId(),
                billRequest.tableId(),
                billRequest.tableNumber(),
                billRequest.id(),
                "Hesap isteği",
                "Masa " + billRequest.tableNumber() + " hesap istedi.",
                Instant.now()
        ));
    }

    private void publish(AdminNotification notification) {
        webSocketHandler.sendToRestaurant(notification.restaurantId(), notification);
    }
}
