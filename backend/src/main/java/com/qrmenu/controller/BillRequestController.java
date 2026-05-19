package com.qrmenu.controller;

import com.qrmenu.dto.BillRequestRequest;
import com.qrmenu.dto.BillRequestResponse;
import com.qrmenu.dto.BillRequestStatusUpdateRequest;
import com.qrmenu.service.BillRequestService;
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
@RequestMapping("/api/bill-requests")
@RequiredArgsConstructor
public class BillRequestController {
    private final BillRequestService billRequestService;

    @GetMapping
    public List<BillRequestResponse> findAll(@RequestParam(required = false) Long restaurantId) {
        return billRequestService.findAll(restaurantId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BillRequestResponse create(@Valid @RequestBody BillRequestRequest request) {
        return billRequestService.create(request);
    }

    @PatchMapping("/{id}/status")
    public BillRequestResponse updateStatus(@PathVariable Long id, @Valid @RequestBody BillRequestStatusUpdateRequest request) {
        return billRequestService.updateStatus(id, request.status());
    }
}
