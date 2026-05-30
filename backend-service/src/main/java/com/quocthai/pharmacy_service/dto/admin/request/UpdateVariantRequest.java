package com.quocthai.pharmacy_service.dto.admin.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateVariantRequest {
    String id;
    String variantName;
    BigDecimal price;
    BigDecimal originalPrice;
    String sku;
    boolean variantDefault;
}
