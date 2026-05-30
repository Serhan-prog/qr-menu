package com.qrmenu.service;

import com.qrmenu.dto.MenuCategoryResponse;
import com.qrmenu.dto.MenuResponse;
import com.qrmenu.dto.ProductResponse;
import com.qrmenu.entity.Category;
import com.qrmenu.entity.Product;
import com.qrmenu.entity.RestaurantTable;
import com.qrmenu.exception.ResourceNotFoundException;
import com.qrmenu.repository.CategoryRepository;
import com.qrmenu.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MenuService {
    private final TableService tableService;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;

    @Transactional(readOnly = true)
    public MenuResponse getMenuByTableCode(String tableCode) {
        RestaurantTable table = tableService.getByCode(tableCode);
        if (!table.isActive()) {
            throw new ResourceNotFoundException("Menu is not available for this table");
        }

        List<Product> products = productRepository.findByRestaurantIdAndAvailableTrueOrderBySortOrderAscNameAsc(table.getRestaurant().getId());
        List<Category> categories = categoryRepository.findByRestaurantIdAndActiveTrueOrderBySortOrderAscNameAsc(table.getRestaurant().getId());

        List<MenuCategoryResponse> categoryResponses = categories.stream()
                .map(category -> new MenuCategoryResponse(
                        category.getId(),
                        category.getName(),
                        category.getDescription(),
                        category.getSortOrder(),
                        products.stream()
                                .filter(product -> product.getCategory().getId().equals(category.getId()))
                                .map(productService::toResponse)
                                .toList()
                ))
                .toList();

        return new MenuResponse(
                table.getRestaurant().getId(),
                table.getRestaurant().getName(),
                table.getId(),
                table.getTableNumber(),
                table.getTableCode(),
                categoryResponses
        );
    }
}
