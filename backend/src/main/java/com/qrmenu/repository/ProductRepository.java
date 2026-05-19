package com.qrmenu.repository;

import com.qrmenu.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByRestaurantIdOrderBySortOrderAscNameAsc(Long restaurantId);

    List<Product> findByCategoryIdOrderBySortOrderAscNameAsc(Long categoryId);

    List<Product> findByRestaurantIdAndAvailableTrueOrderBySortOrderAscNameAsc(Long restaurantId);
}
