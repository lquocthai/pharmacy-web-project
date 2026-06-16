package com.quocthai.pharmacy_service.dto.admin.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OutOfStockVariantResponse {

    String variantId;
    String productId;
    String productName;
    String variantName;
    String sku;
    BigDecimal price;
    boolean active;
}
