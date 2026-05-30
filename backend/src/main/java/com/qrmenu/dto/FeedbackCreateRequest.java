package com.qrmenu.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FeedbackCreateRequest(
        @NotNull @Min(1) @Max(5) Integer foodRating,
        @NotNull @Min(1) @Max(5) Integer serviceRating,
        @NotNull @Min(1) @Max(5) Integer speedRating,
        @NotNull @Min(1) @Max(5) Integer cleanlinessRating,
        @NotNull @Min(1) @Max(5) Integer overallRating,
        @Size(max = 1000) String comment
) {
}
