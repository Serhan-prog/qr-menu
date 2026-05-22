package com.qrmenu.controller;

import com.qrmenu.dto.OrderCreateRequest;
import com.qrmenu.dto.OrderResponse;
import com.qrmenu.dto.OrderStatusUpdateRequest;
import com.qrmenu.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @GetMapping
    public List<OrderResponse> findAll(
            @RequestParam(required = false) Long restaurantId,
            @RequestParam(required = false) Long tableId
    ) {
        return orderService.findAll(restaurantId, tableId);
    }

    @GetMapping("/track/{trackingCode}")
    public OrderResponse findByTrackingCode(@PathVariable String trackingCode) {
        return orderService.findByTrackingCode(trackingCode);
    }

    @GetMapping("/{id}")
    public OrderResponse findById(@PathVariable Long id) {
        return orderService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(@Valid @RequestBody OrderCreateRequest request) {
        return orderService.create(request);
    }

    @PatchMapping("/{id}/status")
    public OrderResponse updateStatus(@PathVariable Long id, @Valid @RequestBody OrderStatusUpdateRequest request) {
        return orderService.updateStatus(id, request.status(), request.cancellationReason());
    }
}
