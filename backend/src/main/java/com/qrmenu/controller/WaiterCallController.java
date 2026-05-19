package com.qrmenu.controller;

import com.qrmenu.dto.WaiterCallRequest;
import com.qrmenu.dto.WaiterCallResponse;
import com.qrmenu.dto.WaiterCallStatusUpdateRequest;
import com.qrmenu.service.WaiterCallService;
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
@RequestMapping("/api/waiter-calls")
@RequiredArgsConstructor
public class WaiterCallController {
    private final WaiterCallService waiterCallService;

    @GetMapping
    public List<WaiterCallResponse> findAll(@RequestParam(required = false) Long restaurantId) {
        return waiterCallService.findAll(restaurantId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WaiterCallResponse create(@Valid @RequestBody WaiterCallRequest request) {
        return waiterCallService.create(request);
    }

    @PatchMapping("/{id}/status")
    public WaiterCallResponse updateStatus(@PathVariable Long id, @Valid @RequestBody WaiterCallStatusUpdateRequest request) {
        return waiterCallService.updateStatus(id, request.status());
    }
}
