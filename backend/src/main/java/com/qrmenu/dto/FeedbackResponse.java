package com.qrmenu.dto;

import java.time.Instant;

public record FeedbackResponse(
        Long id,
        Long restaurantId,
        Long orderId,
        Long tableId,
        Integer tableNumber,
        Integer foodRating,
        Integer serviceRating,
        Integer speedRating,
        Integer cleanlinessRating,
        Integer overallRating,
        String comment,
        Instant createdAt
) {
}
