package com.qrmenu.repository;

import com.qrmenu.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {
    List<RestaurantTable> findByRestaurantIdOrderByTableNumberAsc(Long restaurantId);

    Optional<RestaurantTable> findByTableCode(String tableCode);

    boolean existsByRestaurantIdAndTableNumber(Long restaurantId, Integer tableNumber);

    boolean existsByTableCode(String tableCode);
}
