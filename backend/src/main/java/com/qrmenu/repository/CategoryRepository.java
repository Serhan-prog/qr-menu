package com.qrmenu.repository;

import com.qrmenu.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByRestaurantIdOrderBySortOrderAscNameAsc(Long restaurantId);

    List<Category> findByRestaurantIdAndActiveTrueOrderBySortOrderAscNameAsc(Long restaurantId);
}
