package com.qrmenu.service;

import com.qrmenu.dto.CategoryRequest;
import com.qrmenu.dto.CategoryResponse;
import com.qrmenu.entity.Category;
import com.qrmenu.entity.Restaurant;
import com.qrmenu.exception.ResourceNotFoundException;
import com.qrmenu.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final RestaurantService restaurantService;
    private final AuthContextService authContextService;

    @Transactional(readOnly = true)
    public List<CategoryResponse> findAll(Long restaurantId) {
        Long scopedRestaurantId = authContextService.currentRestaurantId();
        if (restaurantId != null) {
            authContextService.assertRestaurantAccess(restaurantId);
        }
        List<Category> categories = restaurantId == null
                ? categoryRepository.findByRestaurantIdOrderBySortOrderAscNameAsc(scopedRestaurantId)
                : categoryRepository.findByRestaurantIdOrderBySortOrderAscNameAsc(restaurantId);
        return categories.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Category getEntity(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
    }

    @Transactional(readOnly = true)
    public CategoryResponse findById(Long id) {
        Category category = getEntity(id);
        authContextService.assertRestaurantAccess(category.getRestaurant().getId());
        return toResponse(category);
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        authContextService.assertRestaurantAccess(request.restaurantId());
        Category category = new Category();
        apply(category, request);
        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        authContextService.assertRestaurantAccess(request.restaurantId());
        Category category = getEntity(id);
        authContextService.assertRestaurantAccess(category.getRestaurant().getId());
        apply(category, request);
        return toResponse(category);
    }

    @Transactional
    public void delete(Long id) {
        Category category = getEntity(id);
        authContextService.assertRestaurantAccess(category.getRestaurant().getId());
        category.setActive(false);
    }

    private void apply(Category category, CategoryRequest request) {
        Restaurant restaurant = restaurantService.getEntity(request.restaurantId());
        category.setRestaurant(restaurant);
        category.setName(request.name());
        category.setDescription(request.description());
        category.setSortOrder(request.sortOrder() == null ? 0 : request.sortOrder());
        if (request.active() != null) {
            category.setActive(request.active());
        }
    }

    public CategoryResponse toResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getRestaurant().getId(),
                category.getName(),
                category.getDescription(),
                category.getSortOrder(),
                category.isActive(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}
