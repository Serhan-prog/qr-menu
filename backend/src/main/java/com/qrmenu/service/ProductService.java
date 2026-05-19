package com.qrmenu.service;

import com.qrmenu.dto.ProductRequest;
import com.qrmenu.dto.ProductResponse;
import com.qrmenu.entity.Category;
import com.qrmenu.entity.Product;
import com.qrmenu.entity.Restaurant;
import com.qrmenu.exception.BadRequestException;
import com.qrmenu.exception.ResourceNotFoundException;
import com.qrmenu.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final RestaurantService restaurantService;
    private final CategoryService categoryService;

    @Transactional(readOnly = true)
    public List<ProductResponse> findAll(Long restaurantId, Long categoryId) {
        List<Product> products;
        if (categoryId != null) {
            products = productRepository.findByCategoryIdOrderBySortOrderAscNameAsc(categoryId);
        } else if (restaurantId != null) {
            products = productRepository.findByRestaurantIdOrderBySortOrderAscNameAsc(restaurantId);
        } else {
            products = productRepository.findAll();
        }
        return products.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Product getEntity(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
    }

    @Transactional(readOnly = true)
    public ProductResponse findById(Long id) {
        return toResponse(getEntity(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Product product = new Product();
        apply(product, request);
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = getEntity(id);
        apply(product, request);
        return toResponse(product);
    }

    @Transactional
    public void delete(Long id) {
        productRepository.delete(getEntity(id));
    }

    private void apply(Product product, ProductRequest request) {
        Restaurant restaurant = restaurantService.getEntity(request.restaurantId());
        Category category = categoryService.getEntity(request.categoryId());
        if (!category.getRestaurant().getId().equals(restaurant.getId())) {
            throw new BadRequestException("Category does not belong to restaurant");
        }
        product.setRestaurant(restaurant);
        product.setCategory(category);
        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setImageUrl(request.imageUrl());
        product.setSortOrder(request.sortOrder() == null ? 0 : request.sortOrder());
        if (request.available() != null) {
            product.setAvailable(request.available());
        }
    }

    public ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getRestaurant().getId(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getImageUrl(),
                product.isAvailable(),
                product.getSortOrder(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
