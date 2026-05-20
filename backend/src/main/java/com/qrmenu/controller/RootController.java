package com.qrmenu.controller;

import com.qrmenu.dto.ApiInfoResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class RootController {
    @GetMapping("/")
    public ApiInfoResponse index() {
        return new ApiInfoResponse(
                "QR Menu Backend API",
                "UP",
                "1.0.0",
                List.of(
                        "/api/restaurants",
                        "/api/restaurants/current",
                        "/api/auth/ws-ticket",
                        "/api/tables",
                        "/api/categories",
                        "/api/products",
                        "/api/orders",
                        "/api/orders/track/{trackingCode}",
                        "/api/waiter-calls",
                        "/api/bill-requests",
                        "/api/menu/table/{tableCode}"
                )
        );
    }
}
