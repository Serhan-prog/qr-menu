package com.qrmenu.service;

import com.qrmenu.dto.FeedbackCreateRequest;
import com.qrmenu.dto.FeedbackResponse;
import com.qrmenu.entity.Feedback;
import com.qrmenu.entity.Order;
import com.qrmenu.entity.OrderStatus;
import com.qrmenu.exception.BadRequestException;
import com.qrmenu.exception.ResourceNotFoundException;
import com.qrmenu.repository.FeedbackRepository;
import com.qrmenu.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedbackService {
    private final FeedbackRepository feedbackRepository;
    private final OrderRepository orderRepository;
    private final AuthContextService authContextService;
    private final AdminNotificationService adminNotificationService;

    @Transactional(readOnly = true)
    public List<FeedbackResponse> findAll(Long restaurantId) {
        Long scopedRestaurantId = restaurantId != null ? restaurantId : authContextService.currentRestaurantId();
        authContextService.assertRestaurantAccess(scopedRestaurantId);
        return feedbackRepository.findByRestaurantIdOrderByCreatedAtDesc(scopedRestaurantId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public FeedbackResponse createForOrder(String trackingCode, FeedbackCreateRequest request) {
        Order order = orderRepository.findByTrackingCode(trackingCode)
                .orElseThrow(() -> new ResourceNotFoundException("Order tracking code not found"));

        if (order.getStatus() != OrderStatus.SERVED) {
            throw new BadRequestException("Feedback can be submitted only after the order is served");
        }
        if (feedbackRepository.existsByOrderId(order.getId())) {
            throw new BadRequestException("Feedback already submitted for this order");
        }

        Feedback feedback = new Feedback();
        feedback.setRestaurant(order.getRestaurant());
        feedback.setTable(order.getTable());
        feedback.setOrder(order);
        feedback.setFoodRating(request.foodRating());
        feedback.setServiceRating(request.serviceRating());
        feedback.setSpeedRating(request.speedRating());
        feedback.setCleanlinessRating(request.cleanlinessRating());
        feedback.setOverallRating(request.overallRating());
        feedback.setComment(normalizeComment(request.comment()));
        FeedbackResponse response = toResponse(feedbackRepository.save(feedback));
        adminNotificationService.feedbackCreated(response);
        return response;
    }

    private String normalizeComment(String comment) {
        if (comment == null || comment.isBlank()) {
            return null;
        }
        return comment.trim();
    }

    private FeedbackResponse toResponse(Feedback feedback) {
        return new FeedbackResponse(
                feedback.getId(),
                feedback.getRestaurant().getId(),
                feedback.getOrder().getId(),
                feedback.getTable().getId(),
                feedback.getTable().getTableNumber(),
                feedback.getFoodRating(),
                feedback.getServiceRating(),
                feedback.getSpeedRating(),
                feedback.getCleanlinessRating(),
                feedback.getOverallRating(),
                feedback.getComment(),
                feedback.getCreatedAt()
        );
    }
}
