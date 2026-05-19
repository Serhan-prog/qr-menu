package com.qrmenu.repository;

import com.qrmenu.entity.WaiterCall;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WaiterCallRepository extends JpaRepository<WaiterCall, Long> {
    List<WaiterCall> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);
}
