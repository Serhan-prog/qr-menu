package com.qrmenu.service;

import com.qrmenu.dto.WaiterCallRequest;
import com.qrmenu.dto.WaiterCallResponse;
import com.qrmenu.entity.RestaurantTable;
import com.qrmenu.entity.WaiterCall;
import com.qrmenu.entity.WaiterCallStatus;
import com.qrmenu.exception.ResourceNotFoundException;
import com.qrmenu.repository.WaiterCallRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WaiterCallService {
    private final WaiterCallRepository waiterCallRepository;
    private final TableService tableService;
    private final AdminNotificationService adminNotificationService;

    @Transactional(readOnly = true)
    public List<WaiterCallResponse> findAll(Long restaurantId) {
        List<WaiterCall> calls = restaurantId == null
                ? waiterCallRepository.findAll()
                : waiterCallRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
        return calls.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public WaiterCall getEntity(Long id) {
        return waiterCallRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Waiter call not found: " + id));
    }

    @Transactional
    public WaiterCallResponse create(WaiterCallRequest request) {
        RestaurantTable table = tableService.getByCode(request.tableCode());
        WaiterCall call = new WaiterCall();
        call.setRestaurant(table.getRestaurant());
        call.setTable(table);
        call.setMessage(request.message());
        WaiterCallResponse response = toResponse(waiterCallRepository.save(call));
        adminNotificationService.waiterCallCreated(response);
        return response;
    }

    @Transactional
    public WaiterCallResponse updateStatus(Long id, WaiterCallStatus status) {
        WaiterCall call = getEntity(id);
        call.setStatus(status);
        return toResponse(call);
    }

    private WaiterCallResponse toResponse(WaiterCall call) {
        return new WaiterCallResponse(
                call.getId(),
                call.getRestaurant().getId(),
                call.getTable().getId(),
                call.getTable().getTableNumber(),
                call.getTable().getTableCode(),
                call.getStatus(),
                call.getMessage(),
                call.getCreatedAt(),
                call.getUpdatedAt()
        );
    }
}
