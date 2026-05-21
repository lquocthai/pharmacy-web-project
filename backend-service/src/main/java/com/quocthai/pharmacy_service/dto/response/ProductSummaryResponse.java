package com.quocthai.pharmacy_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductSummaryResponse {
    String id;
    String name;
    String slug;
    BigDecimal price;
    BigDecimal oldPrice;
    String unit;
    String manufacturer;
    String primaryImageUrl; // Chỉ lấy 1 ảnh đại diện
}
