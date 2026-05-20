package com.qrmenu.service;

import com.qrmenu.dto.BillRequestRequest;
import com.qrmenu.dto.BillRequestResponse;
import com.qrmenu.entity.BillRequest;
import com.qrmenu.entity.BillRequestStatus;
import com.qrmenu.entity.RestaurantTable;
import com.qrmenu.exception.ResourceNotFoundException;
import com.qrmenu.repository.BillRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BillRequestService {
    private final BillRequestRepository billRequestRepository;
    private final TableService tableService;
    private final AdminNotificationService adminNotificationService;
    private final AuthContextService authContextService;

    @Transactional(readOnly = true)
    public List<BillRequestResponse> findAll(Long restaurantId) {
        Long scopedRestaurantId = authContextService.currentRestaurantId();
        if (restaurantId != null) {
            authContextService.assertRestaurantAccess(restaurantId);
        }
        List<BillRequest> requests = restaurantId == null
                ? billRequestRepository.findByRestaurantIdOrderByCreatedAtDesc(scopedRestaurantId)
                : billRequestRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
        return requests.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public BillRequest getEntity(Long id) {
        return billRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill request not found: " + id));
    }

    @Transactional
    public BillRequestResponse create(BillRequestRequest request) {
        RestaurantTable table = tableService.getByCode(request.tableCode());
        BillRequest billRequest = new BillRequest();
        billRequest.setRestaurant(table.getRestaurant());
        billRequest.setTable(table);
        billRequest.setNote(request.note());
        BillRequestResponse response = toResponse(billRequestRepository.save(billRequest));
        adminNotificationService.billRequestCreated(response);
        return response;
    }

    @Transactional
    public BillRequestResponse updateStatus(Long id, BillRequestStatus status) {
        BillRequest billRequest = getEntity(id);
        authContextService.assertRestaurantAccess(billRequest.getRestaurant().getId());
        billRequest.setStatus(status);
        return toResponse(billRequest);
    }

    private BillRequestResponse toResponse(BillRequest billRequest) {
        return new BillRequestResponse(
                billRequest.getId(),
                billRequest.getRestaurant().getId(),
                billRequest.getTable().getId(),
                billRequest.getTable().getTableNumber(),
                billRequest.getTable().getTableCode(),
                billRequest.getStatus(),
                billRequest.getNote(),
                billRequest.getCreatedAt(),
                billRequest.getUpdatedAt()
        );
    }
}
