package com.qrmenu.dto;

import java.util.List;

public record MenuResponse(
        Long restaurantId,
        String restaurantName,
        Long tableId,
        Integer tableNumber,
        String tableCode,
        List<MenuCategoryResponse> categories
) {
}
