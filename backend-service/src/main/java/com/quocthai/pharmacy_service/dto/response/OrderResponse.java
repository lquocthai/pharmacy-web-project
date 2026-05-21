package com.quocthai.pharmacy_service.dto.response;

import com.quocthai.pharmacy_service.constants.OrderStatus;
import com.quocthai.pharmacy_service.constants.PaymentMethod;
import com.quocthai.pharmacy_service.constants.PaymentStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderResponse {
    String id;
    String orderCode;
    OrderStatus status;
    PaymentMethod paymentMethod;
    PaymentStatus paymentStatus;

    BigDecimal totalAmount;
    BigDecimal shippingFee;
    BigDecimal finalAmount;
    String note;

    // Snapshot địa chỉ giao hàng
    String shippingFullName;
    String shippingPhone;
    String shippingProvince;
    String shippingDistrict;
    String shippingWard;
    String shippingAddressDetail;
    String shippingFullAddress; // chuỗi ghép đầy đủ để hiển thị nhanh

    List<OrderItemResponse> items;
    List<OrderStatusHistoryResponse> statusHistory;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    LocalDateTime cancelledAt;
    String cancelReason;
    String paymentTransactionId;
    LocalDateTime paidAt;
}
