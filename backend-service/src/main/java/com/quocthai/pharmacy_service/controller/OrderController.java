package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.constants.OrderStatus;
import com.quocthai.pharmacy_service.dto.request.CancelOrderRequest;
import com.quocthai.pharmacy_service.dto.request.CreateOrderRequest;
import com.quocthai.pharmacy_service.dto.response.*;
import com.quocthai.pharmacy_service.service.OrderService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderController {

    OrderService orderService;

    /** Đặt hàng */
    @PostMapping
    public ApiResponse<OrderResponse> placeOrder(@Valid @RequestBody CreateOrderRequest request) {
        return ApiResponse.<OrderResponse>builder()
                .result(orderService.placeOrder(request))
                .build();
    }

    /** Lịch sử đơn hàng của user, lọc theo status */
    @GetMapping
    public ApiResponse<List<OrderResponse>> getMyOrders(
            @RequestParam(required = false) OrderStatus status) {
        return ApiResponse.<List<OrderResponse>>builder()
                .result(orderService.getMyOrders(status))
                .build();
    }

    /** Lấy đơn hàng theo orderCode — dùng cho trang kết quả thanh toán */
    @GetMapping("/code/{orderCode}")
    public ApiResponse<OrderResponse> getOrderByCode(@PathVariable String orderCode) {
        return ApiResponse.<OrderResponse>builder()
                .result(orderService.getByOrderCode(orderCode))
                .build();
    }

    /** Chi tiết đơn hàng theo orderCode (ownership check) */
    @GetMapping("/{orderCode}")
    public ApiResponse<OrderResponse> getOrderDetail(@PathVariable String orderCode) {
        return ApiResponse.<OrderResponse>builder()
                .result(orderService.getOrderDetailByCode(orderCode))
                .build();
    }

    /** Tracking trạng thái đơn hàng */
    @GetMapping("/{orderId}/tracking")
    public ApiResponse<List<OrderStatusHistoryResponse>> getTracking(
            @PathVariable String orderId) {
        return ApiResponse.<List<OrderStatusHistoryResponse>>builder()
                .result(orderService.getOrderTracking(orderId))
                .build();
    }

    /** Hủy đơn (user — chỉ được khi PENDING) */
    @PatchMapping("/{orderId}/cancel")
    public ApiResponse<OrderResponse> cancelOrder(
            @PathVariable String orderId,
            @Valid @RequestBody CancelOrderRequest request) {
        return ApiResponse.<OrderResponse>builder()
                .result(orderService.cancelOrder(orderId, request))
                .build();
    }
}
