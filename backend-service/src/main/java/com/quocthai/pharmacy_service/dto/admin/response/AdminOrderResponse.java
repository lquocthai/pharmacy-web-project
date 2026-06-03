package com.quocthai.pharmacy_service.dto.admin.response;

import com.quocthai.pharmacy_service.constants.OrderStatus;
import com.quocthai.pharmacy_service.constants.PaymentMethod;
import com.quocthai.pharmacy_service.constants.PaymentStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminOrderResponse {
    String id;
    String orderCode;

    String customerName;
    String customerPhone;

    Integer productCount;

    BigDecimal finalAmount;

    PaymentMethod paymentMethod;
    PaymentStatus paymentStatus;

    OrderStatus status;

    LocalDateTime createdAt;
}