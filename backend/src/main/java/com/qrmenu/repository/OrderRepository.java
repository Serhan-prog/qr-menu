package com.qrmenu.repository;

import com.qrmenu.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);

    List<Order> findByTableIdOrderByCreatedAtDesc(Long tableId);

    Optional<Order> findByTrackingCode(String trackingCode);

    boolean existsByTrackingCode(String trackingCode);
}
