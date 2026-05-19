package com.qrmenu.dto;

import java.util.List;

public record MenuCategoryResponse(
        Long id,
        String name,
        String description,
        Integer sortOrder,
        List<ProductResponse> products
) {
}
