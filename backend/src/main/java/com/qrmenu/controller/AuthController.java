package com.qrmenu.controller;

import com.qrmenu.dto.AuthResponse;
import com.qrmenu.dto.LoginRequest;
import com.qrmenu.dto.WebSocketTicketResponse;
import com.qrmenu.service.AuthService;
import com.qrmenu.service.WebSocketTicketService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final WebSocketTicketService webSocketTicketService;

    @Value("${app.jwt.expiration-minutes}")
    private long expirationMinutes;

    @Value("${app.security.cookie-secure:false}")
    private boolean cookieSecure;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthResponse auth = authService.login(request);
        ResponseCookie cookie = ResponseCookie.from("qr_menu_token", auth.token())
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(expirationMinutes * 60)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
        return auth;
    }

    @PostMapping("/logout")
    public void logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("qr_menu_token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    @GetMapping("/ws-ticket")
    public WebSocketTicketResponse webSocketTicket() {
        return webSocketTicketService.issue();
    }
}
