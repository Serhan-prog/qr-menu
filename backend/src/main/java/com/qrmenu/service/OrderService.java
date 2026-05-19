package com.qrmenu.service;

import com.qrmenu.dto.OrderCreateRequest;
import com.qrmenu.dto.OrderItemResponse;
import com.qrmenu.dto.OrderResponse;
import com.qrmenu.entity.Order;
import com.qrmenu.entity.OrderItem;
import com.qrmenu.entity.OrderStatus;
import com.qrmenu.entity.Product;
import com.qrmenu.entity.RestaurantTable;
import com.qrmenu.exception.BadRequestException;
import com.qrmenu.exception.ResourceNotFoundException;
import com.qrmenu.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final TableService tableService;
    private final ProductService productService;
    private final AdminNotificationService adminNotificationService;

    @Transactional(readOnly = true)
    public List<OrderResponse> findAll(Long restaurantId, Long tableId) {
        List<Order> orders;
        if (tableId != null) {
            orders = orderRepository.findByTableIdOrderByCreatedAtDesc(tableId);
        } else if (restaurantId != null) {
            orders = orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
        } else {
            orders = orderRepository.findAll();
        }
        return orders.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Order getEntity(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(Long id) {
        return toResponse(getEntity(id));
    }

    @Transactional
    public OrderResponse create(OrderCreateRequest request) {
        RestaurantTable table = tableService.getByCode(request.tableCode());
        if (!table.isActive()) {
            throw new BadRequestException("Table is not active");
        }

        Order order = new Order();
        order.setRestaurant(table.getRestaurant());
        order.setTable(table);
        order.setNote(request.note());

        BigDecimal total = BigDecimal.ZERO;
        for (var itemRequest : request.items()) {
            Product product = productService.getEntity(itemRequest.productId());
            if (!product.isAvailable()) {
                throw new BadRequestException("Product is not available: " + product.getName());
            }
            if (!product.getRestaurant().getId().equals(table.getRestaurant().getId())) {
                throw new BadRequestException("Product does not belong to table restaurant");
            }

            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(itemRequest.quantity()));
            OrderItem item = new OrderItem();
            item.setProduct(product);
            item.setQuantity(itemRequest.quantity());
            item.setUnitPrice(product.getPrice());
            item.setLineTotal(lineTotal);
            item.setNote(itemRequest.note());
            order.addItem(item);
            total = total.add(lineTotal);
        }

        order.setTotalAmount(total);
        OrderResponse response = toResponse(orderRepository.save(order));
        adminNotificationService.orderCreated(response);
        return response;
    }

    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatus status) {
        Order order = getEntity(id);
        order.setStatus(status);
        return toResponse(order);
    }

    public OrderResponse toResponse(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getRestaurant().getId(),
                order.getTable().getId(),
                order.getTable().getTableNumber(),
                order.getTable().getTableCode(),
                order.getStatus(),
                order.getNote(),
                order.getTotalAmount(),
                order.getItems().stream().map(this::toItemResponse).toList(),
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }

    private OrderItemResponse toItemResponse(OrderItem item) {
        return new OrderItemResponse(
                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getLineTotal(),
                item.getNote()
        );
    }
}
