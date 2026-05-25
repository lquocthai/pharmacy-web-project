package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.constants.OrderStatus;
import com.quocthai.pharmacy_service.dto.request.CreateOrderRequest;
import com.quocthai.pharmacy_service.dto.response.*;
import com.quocthai.pharmacy_service.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderController {

    OrderService orderService;

    // ── POST /orders ─────────────────────────────
    @PostMapping
    public ApiResponse<OrderResponse> placeOrder(@Valid @RequestBody CreateOrderRequest request) {
        return ApiResponse.<OrderResponse>builder()
                .result(orderService.placeOrder(request))
                .build();
    }

    // ── GET /orders (history) ─────────────────────
    @GetMapping
    public ApiResponse<List<OrderResponse>> getMyOrders(@RequestParam(required = false) OrderStatus status) {
        return ApiResponse.<List<OrderResponse>>builder()
                .result(orderService.getMyOrders(status))
                .build();
    }
    // lấy order theo mã code
    @GetMapping("/code/{orderCode}")
    public ApiResponse<OrderResponse> getOrderByCode(
            @PathVariable String orderCode
    ) {
        return ApiResponse.<OrderResponse>builder()
                .result(orderService.getByOrderCode(orderCode))
                .build();
    }

    // ── GET /orders/{id} ─────────────────────────
    @GetMapping("/{orderCode}")
    public ApiResponse<OrderResponse> getOrderDetail(@PathVariable String orderCode) {
        return ApiResponse.<OrderResponse>builder()
                .result(orderService.getOrderDetailByCode(orderCode))
                .build();
    }

    // ── GET /orders/{id}/tracking ────────────────
    @GetMapping("/{orderId}/tracking")
    public ApiResponse<List<OrderStatusHistoryResponse>> getTracking(@PathVariable String orderId) {
        return ApiResponse.<List<OrderStatusHistoryResponse>>builder()
                .result(orderService.getOrderTracking(orderId))
                .build();
    }
//     sữa lại phần restore phần cancel order
//    // ── PATCH /orders/{id}/cancel ────────────────
//    @PatchMapping("/{orderId}/cancel")
//    public ResponseEntity<OrderResponse> cancelOrder(
//            @PathVariable String orderId,
//            @Valid @RequestBody CancelOrderRequest request
//    ) {
//        return ResponseEntity.ok(orderService.cancelOrder(orderId, request));
//    }
}