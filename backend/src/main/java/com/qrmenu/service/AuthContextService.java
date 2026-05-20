package com.qrmenu.service;

import com.qrmenu.entity.User;
import com.qrmenu.exception.BadRequestException;
import com.qrmenu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthContextService {
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Optional<User> currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            return Optional.empty();
        }
        return userRepository.findByEmail(authentication.getName());
    }

    @Transactional(readOnly = true)
    public Long currentRestaurantId() {
        return currentUser()
                .map(user -> user.getRestaurant().getId())
                .orElseThrow(() -> new BadRequestException("Authenticated restaurant context not found"));
    }

    @Transactional(readOnly = true)
    public void assertRestaurantAccess(Long restaurantId) {
        if (restaurantId == null) {
            throw new BadRequestException("Restaurant id is required");
        }
        Long currentRestaurantId = currentRestaurantId();
        if (!currentRestaurantId.equals(restaurantId)) {
            throw new BadRequestException("Restaurant access denied");
        }
    }
}
