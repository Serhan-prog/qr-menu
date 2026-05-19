package com.qrmenu.service;

import com.qrmenu.dto.AuthResponse;
import com.qrmenu.dto.LoginRequest;
import com.qrmenu.entity.User;
import com.qrmenu.exception.BadRequestException;
import com.qrmenu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadRequestException("E-posta veya şifre hatalı"));

        if (!user.isActive() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadRequestException("E-posta veya şifre hatalı");
        }

        return new AuthResponse(
                jwtService.generateToken(user),
                "Bearer",
                user.getId(),
                user.getRestaurant().getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole()
        );
    }
}
