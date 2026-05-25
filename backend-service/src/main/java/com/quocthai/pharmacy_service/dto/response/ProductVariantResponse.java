package com.quocthai.pharmacy_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductVariantResponse {
    String id;
    String sku;
    String variantName;     // Ví dụ: Hộp 100 viên, Vỉ 10 viên
    BigDecimal price;
    BigDecimal originalPrice;
    boolean variantDefault;
    int stockQuantity;      // Tồn kho thực tế tổng hợp từ các Lô (Batch) còn hạn của SKU này
}