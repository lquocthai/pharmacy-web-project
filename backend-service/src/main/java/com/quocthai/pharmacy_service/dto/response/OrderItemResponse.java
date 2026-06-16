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

    //  BỔ SUNG CÁC TRƯỜNG THÔNG TIN SKU
    String variantId;       // ID của phân loại hàng
    String variantName;     // Tên phân loại (Ví dụ: Hộp 100 viên, Vỉ 10 viên)
    String sku;             // Mã SKU để đối chiếu khi đóng gói hàng (Ví dụ: PANA-H100)

    String imageUrl;
    int quantity;
    BigDecimal priceAtTime;
    BigDecimal subtotal;
}
