package com.quocthai.pharmacy_service.controller.admin;
import com.quocthai.pharmacy_service.constants.OrderStatus;
import com.quocthai.pharmacy_service.constants.PaymentStatus;
import com.quocthai.pharmacy_service.dto.admin.request.UpdateOrderStatusRequest;
import com.quocthai.pharmacy_service.dto.admin.response.AdminOrderResponse;
import com.quocthai.pharmacy_service.dto.request.CancelOrderRequest;
import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.OrderStatusHistoryResponse;
import com.quocthai.pharmacy_service.dto.response.PageResponse;
import com.quocthai.pharmacy_service.service.OrderService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/admin/orders")
public class AdminOrderController {
    OrderService orderService;
    @GetMapping()
    public ApiResponse<PageResponse<AdminOrderResponse>> getOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) PaymentStatus paymentStatus
    ) {
        return ApiResponse.<PageResponse<AdminOrderResponse>>builder()
                .result(orderService.getOrders(page, size, keyword, status, paymentStatus))
                .build();
    }
    @PatchMapping("/{orderId}/status")
    public ApiResponse<String> updateStatus(
            @PathVariable String orderId,
            @RequestBody @Valid UpdateOrderStatusRequest request
    ) {
        orderService.updateStatus(orderId, request);

        return ApiResponse.<String>builder()
                .message("Cập nhật trạng thái thành công")
                .build();
    }
    // hủy đơn
    @PatchMapping("/{orderId}/cancel")
    public ApiResponse<String> cancelOrder(
            @PathVariable String orderId,
            @RequestBody @Valid CancelOrderRequest request
    ) {
        orderService.cancelOrderByAdmin(orderId, request);

        return ApiResponse.<String>builder()
                .message("Hủy đơn thành công")
                .build();
    }
    // xem lịch sử đơn hàng
    @GetMapping("/{orderId}/history")
    public ApiResponse<List<OrderStatusHistoryResponse>>
    getOrderHistory(
            @PathVariable String orderId
    ) {
        return ApiResponse
                .<List<OrderStatusHistoryResponse>>builder()
                .result(orderService.getOrderHistory(orderId))
                .build();
    }
}

