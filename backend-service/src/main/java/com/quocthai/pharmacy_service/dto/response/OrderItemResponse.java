package com.quocthai.pharmacy_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItemResponse {
    String id;
    String productId;
    String productName;
    String productSlug;
    String imageUrl;
    String unit;
    int quantity;
    BigDecimal priceAtTime;
    BigDecimal subtotal;
}
