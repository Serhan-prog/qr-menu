package com.qrmenu.service;

import com.qrmenu.dto.TableRequest;
import com.qrmenu.dto.TableResponse;
import com.qrmenu.entity.Restaurant;
import com.qrmenu.entity.RestaurantTable;
import com.qrmenu.exception.BadRequestException;
import com.qrmenu.exception.ResourceNotFoundException;
import com.qrmenu.repository.RestaurantTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TableService {
    private final RestaurantTableRepository tableRepository;
    private final RestaurantService restaurantService;
    private final AuthContextService authContextService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.qr.public-base-url}")
    private String publicBaseUrl;

    @Transactional(readOnly = true)
    public List<TableResponse> findAll(Long restaurantId) {
        Long scopedRestaurantId = authContextService.currentRestaurantId();
        if (restaurantId != null) {
            authContextService.assertRestaurantAccess(restaurantId);
        }
        List<RestaurantTable> tables = restaurantId == null
                ? tableRepository.findByRestaurantIdOrderByTableNumberAsc(scopedRestaurantId)
                : tableRepository.findByRestaurantIdOrderByTableNumberAsc(restaurantId);
        return tables.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public RestaurantTable getEntity(Long id) {
        return tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found: " + id));
    }

    @Transactional(readOnly = true)
    public RestaurantTable getByCode(String tableCode) {
        return tableRepository.findByTableCode(tableCode)
                .orElseThrow(() -> new ResourceNotFoundException("Table code not found: " + tableCode));
    }

    @Transactional(readOnly = true)
    public TableResponse findById(Long id) {
        RestaurantTable table = getEntity(id);
        authContextService.assertRestaurantAccess(table.getRestaurant().getId());
        return toResponse(table);
    }

    @Transactional
    public TableResponse create(TableRequest request) {
        authContextService.assertRestaurantAccess(request.restaurantId());
        Restaurant restaurant = restaurantService.getEntity(request.restaurantId());
        if (tableRepository.existsByRestaurantIdAndTableNumber(request.restaurantId(), request.tableNumber())) {
            throw new BadRequestException("Table number already exists for restaurant");
        }

        RestaurantTable table = new RestaurantTable();
        table.setRestaurant(restaurant);
        table.setTableNumber(request.tableNumber());
        table.setTableCode(generateUniqueCode(restaurant.getId(), request.tableNumber()));
        if (request.active() != null) {
            table.setActive(request.active());
        }
        return toResponse(tableRepository.save(table));
    }

    @Transactional
    public TableResponse update(Long id, TableRequest request) {
        authContextService.assertRestaurantAccess(request.restaurantId());
        RestaurantTable table = getEntity(id);
        authContextService.assertRestaurantAccess(table.getRestaurant().getId());
        if (!table.getRestaurant().getId().equals(request.restaurantId())) {
            table.setRestaurant(restaurantService.getEntity(request.restaurantId()));
        }
        if (!table.getTableNumber().equals(request.tableNumber())
                && tableRepository.existsByRestaurantIdAndTableNumber(request.restaurantId(), request.tableNumber())) {
            throw new BadRequestException("Table number already exists for restaurant");
        }
        table.setTableNumber(request.tableNumber());
        if (request.active() != null) {
            table.setActive(request.active());
        }
        return toResponse(table);
    }

    @Transactional
    public void delete(Long id) {
        RestaurantTable table = getEntity(id);
        authContextService.assertRestaurantAccess(table.getRestaurant().getId());
        table.setActive(false);
    }

    public TableResponse toResponse(RestaurantTable table) {
        String qrUrl = publicBaseUrl.replaceAll("/+$", "") + "/menu/table/" + table.getTableCode();
        return new TableResponse(
                table.getId(),
                table.getRestaurant().getId(),
                table.getTableNumber(),
                table.getTableCode(),
                qrUrl,
                table.isActive(),
                table.getCreatedAt(),
                table.getUpdatedAt()
        );
    }

    private String generateUniqueCode(Long restaurantId, Integer tableNumber) {
        String code;
        do {
            byte[] bytes = new byte[4];
            secureRandom.nextBytes(bytes);
            code = "r" + restaurantId + "-t" + tableNumber + "-" + HexFormat.of().formatHex(bytes);
        } while (tableRepository.existsByTableCode(code));
        return code;
    }
}
