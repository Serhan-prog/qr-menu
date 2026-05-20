package com.qrmenu.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.qrmenu.dto.ApiErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class PublicRateLimitFilter extends OncePerRequestFilter {
    private final ObjectMapper objectMapper;
    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    @Value("${app.rate-limit.public-requests-per-minute:30}")
    private int maxRequestsPerMinute;

    public PublicRateLimitFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!isLimitedPublicAction(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = clientIp(request) + ":" + request.getMethod() + ":" + request.getRequestURI();
        long currentWindow = Instant.now().getEpochSecond() / 60;
        WindowCounter counter = counters.compute(key, (ignored, existing) -> {
            if (existing == null || existing.window != currentWindow) {
                return new WindowCounter(currentWindow);
            }
            return existing;
        });
        if (counters.size() > 10_000) {
            counters.entrySet().removeIf(entry -> entry.getValue().window < currentWindow);
        }

        if (counter.count.incrementAndGet() > maxRequestsPerMinute) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            ApiErrorResponse error = new ApiErrorResponse(
                    Instant.now(),
                    HttpStatus.TOO_MANY_REQUESTS.value(),
                    HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase(),
                    "Too many requests. Please wait before trying again.",
                    request.getRequestURI(),
                    null
            );
            response.getWriter().write(objectMapper.writeValueAsString(error));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isLimitedPublicAction(HttpServletRequest request) {
        if (!"POST".equals(request.getMethod())) {
            return false;
        }
        String path = request.getRequestURI();
        return path.equals("/api/orders")
                || path.equals("/api/waiter-calls")
                || path.equals("/api/bill-requests")
                || path.equals("/api/auth/login");
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static class WindowCounter {
        private final long window;
        private final AtomicInteger count = new AtomicInteger(0);

        private WindowCounter(long window) {
            this.window = window;
        }
    }
}
