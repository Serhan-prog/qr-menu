package com.qrmenu.service;

import com.qrmenu.dto.RestaurantRequest;
import com.qrmenu.dto.RestaurantResponse;
import com.qrmenu.entity.Restaurant;
import com.qrmenu.exception.ResourceNotFoundException;
import com.qrmenu.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RestaurantService {
    private final RestaurantRepository restaurantRepository;

    @Transactional(readOnly = true)
    public List<RestaurantResponse> findAll() {
        return restaurantRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Restaurant getEntity(Long id) {
        return restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found: " + id));
    }

    @Transactional(readOnly = true)
    public RestaurantResponse findById(Long id) {
        return toResponse(getEntity(id));
    }

    @Transactional
    public RestaurantResponse create(RestaurantRequest request) {
        Restaurant restaurant = new Restaurant();
        apply(restaurant, request);
        return toResponse(restaurantRepository.save(restaurant));
    }

    @Transactional
    public RestaurantResponse update(Long id, RestaurantRequest request) {
        Restaurant restaurant = getEntity(id);
        apply(restaurant, request);
        return toResponse(restaurant);
    }

    @Transactional
    public void delete(Long id) {
        Restaurant restaurant = getEntity(id);
        restaurantRepository.delete(restaurant);
    }

    private void apply(Restaurant restaurant, RestaurantRequest request) {
        restaurant.setName(request.name());
        restaurant.setAddress(request.address());
        restaurant.setPhone(request.phone());
        if (request.active() != null) {
            restaurant.setActive(request.active());
        }
    }

    public RestaurantResponse toResponse(Restaurant restaurant) {
        return new RestaurantResponse(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getAddress(),
                restaurant.getPhone(),
                restaurant.isActive(),
                restaurant.getCreatedAt(),
                restaurant.getUpdatedAt()
        );
    }
}
