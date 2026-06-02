package com.qrmenu.service;

import com.qrmenu.dto.RestaurantRequest;
import com.qrmenu.dto.RestaurantResponse;
import com.qrmenu.entity.Restaurant;
import com.qrmenu.exception.BadRequestException;
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
    private final AuthContextService authContextService;

    @Transactional(readOnly = true)
    public List<RestaurantResponse> findAll() {
        return List.of(current());
    }

    @Transactional(readOnly = true)
    public RestaurantResponse current() {
        return toResponse(getEntity(authContextService.currentRestaurantId()));
    }

    @Transactional(readOnly = true)
    public RestaurantResponse publicCurrent() {
        Restaurant restaurant = restaurantRepository.findFirstByActiveTrueOrderByIdAsc()
                .or(() -> restaurantRepository.findFirstByOrderByIdAsc())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));
        return toResponse(restaurant);
    }

    @Transactional(readOnly = true)
    public Restaurant getEntity(Long id) {
        return restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found: " + id));
    }

    @Transactional(readOnly = true)
    public RestaurantResponse findById(Long id) {
        authContextService.assertRestaurantAccess(id);
        return toResponse(getEntity(id));
    }

    @Transactional
    public RestaurantResponse create(RestaurantRequest request) {
        throw new BadRequestException("Restaurant creation is disabled in single-restaurant production mode");
    }

    @Transactional
    public RestaurantResponse createInternal(RestaurantRequest request) {
        Restaurant restaurant = new Restaurant();
        apply(restaurant, request);
        return toResponse(restaurantRepository.save(restaurant));
    }

    @Transactional
    public RestaurantResponse update(Long id, RestaurantRequest request) {
        authContextService.assertRestaurantAccess(id);
        Restaurant restaurant = getEntity(id);
        apply(restaurant, request);
        return toResponse(restaurant);
    }

    @Transactional
    public void delete(Long id) {
        throw new BadRequestException("Restaurant deletion is disabled in production mode");
    }

    @Transactional
    public void deleteInternal(Long id) {
        Restaurant restaurant = getEntity(id);
        restaurantRepository.delete(restaurant);
    }

    private void apply(Restaurant restaurant, RestaurantRequest request) {
        restaurant.setName(request.name());
        restaurant.setAddress(request.address());
        restaurant.setPhone(request.phone());
        restaurant.setActive(true);
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
