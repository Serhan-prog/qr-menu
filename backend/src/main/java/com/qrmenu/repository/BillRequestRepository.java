package com.qrmenu.repository;

import com.qrmenu.entity.BillRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BillRequestRepository extends JpaRepository<BillRequest, Long> {
    List<BillRequest> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);
}
