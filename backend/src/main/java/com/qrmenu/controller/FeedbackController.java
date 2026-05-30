package com.qrmenu.controller;

import com.qrmenu.dto.FeedbackCreateRequest;
import com.qrmenu.dto.FeedbackResponse;
import com.qrmenu.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {
    private final FeedbackService feedbackService;

    @GetMapping
    public List<FeedbackResponse> findAll(@RequestParam(required = false) Long restaurantId) {
        return feedbackService.findAll(restaurantId);
    }

    @PostMapping("/order/{trackingCode}")
    @ResponseStatus(HttpStatus.CREATED)
    public FeedbackResponse createForOrder(
            @PathVariable String trackingCode,
            @Valid @RequestBody FeedbackCreateRequest request
    ) {
        return feedbackService.createForOrder(trackingCode, request);
    }
}
