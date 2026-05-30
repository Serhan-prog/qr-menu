package com.qrmenu.service;

import com.qrmenu.dto.UserRequest;
import com.qrmenu.dto.UserResponse;
import com.qrmenu.entity.Restaurant;
import com.qrmenu.entity.User;
import com.qrmenu.entity.UserRole;
import com.qrmenu.exception.BadRequestException;
import com.qrmenu.exception.ResourceNotFoundException;
import com.qrmenu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final RestaurantService restaurantService;
    private final PasswordEncoder passwordEncoder;
    private final AuthContextService authContextService;

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findByRestaurantIdOrderByFullNameAsc(authContextService.currentRestaurantId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public User getEntity(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        User user = getEntity(id);
        authContextService.assertRestaurantAccess(user.getRestaurant().getId());
        return toResponse(user);
    }

    @Transactional
    public UserResponse create(UserRequest request) {
        authContextService.assertRestaurantAccess(request.restaurantId());
        if (!StringUtils.hasText(request.password())) {
            throw new BadRequestException("Password is required");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email already exists");
        }
        User user = new User();
        apply(user, request);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse update(Long id, UserRequest request) {
        authContextService.assertRestaurantAccess(request.restaurantId());
        User user = getEntity(id);
        authContextService.assertRestaurantAccess(user.getRestaurant().getId());
        userRepository.findByEmail(request.email())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BadRequestException("Email already exists");
                });
        apply(user, request);
        return toResponse(user);
    }

    @Transactional
    public void delete(Long id) {
        User user = getEntity(id);
        authContextService.assertRestaurantAccess(user.getRestaurant().getId());
        if (authContextService.currentUser().map(current -> current.getId().equals(id)).orElse(false)) {
            throw new BadRequestException("Current user cannot be deleted");
        }
        userRepository.delete(user);
    }

    private void apply(User user, UserRequest request) {
        Restaurant restaurant = restaurantService.getEntity(request.restaurantId());
        user.setRestaurant(restaurant);
        user.setEmail(request.email());
        user.setFullName(request.fullName());
        if (StringUtils.hasText(request.password())) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        user.setRole(request.role() == null ? UserRole.ADMIN : request.role());
        if (request.active() != null) {
            user.setActive(request.active());
        }
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getRestaurant().getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
