package com.qrmenu.repository;

import com.qrmenu.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    Optional<Restaurant> findFirstByActiveTrueOrderByIdAsc();

    Optional<Restaurant> findFirstByOrderByIdAsc();
}
