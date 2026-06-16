package com.quocthai.pharmacy_service.dto.response;

import com.quocthai.pharmacy_service.constants.OrderStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderStatusHistoryResponse {
    String id;
    OrderStatus status;
    String note;
    String changedBy;
    LocalDateTime changedAt;
}
