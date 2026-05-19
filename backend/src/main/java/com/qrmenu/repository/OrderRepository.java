package com.qrmenu.repository;

import com.qrmenu.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);

    List<Order> findByTableIdOrderByCreatedAtDesc(Long tableId);
}
