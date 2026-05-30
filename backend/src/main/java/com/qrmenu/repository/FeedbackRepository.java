package com.qrmenu.repository;

import com.qrmenu.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);

    boolean existsByOrderId(Long orderId);
}
