package com.qrmenu.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class StartupSecurityValidator implements ApplicationRunner {
    private static final List<String> WEAK_SECRETS = List.of(
            "qr-menu-development-secret-key-change-this-value-in-production",
            "change-this-to-a-long-random-secret-in-production"
    );

    private final Environment environment;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.seed.enabled:false}")
    private boolean seedEnabled;

    public StartupSecurityValidator(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (jwtSecret == null || jwtSecret.length() < 64 || WEAK_SECRETS.contains(jwtSecret)) {
            throw new IllegalStateException("JWT_SECRET must be a strong production secret with at least 64 characters.");
        }

        boolean prodProfileActive = List.of(environment.getActiveProfiles()).stream()
                .anyMatch(profile -> profile.toLowerCase().contains("prod"));
        if (seedEnabled && prodProfileActive) {
            throw new IllegalStateException("SEED_ENABLED must be false when the prod profile is active.");
        }
    }
}
