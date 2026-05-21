package com.quocthai.pharmacy_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CartItemResponse {
    String id;           // CartItem id
    String productId;
    String productName;
    String productSlug;
    String unit;
    BigDecimal price;        // giá hiện tại của sản phẩm
    BigDecimal priceAtTime;  // giá lúc thêm vào giỏ
    int quantity;
    BigDecimal subtotal;     // priceAtTime * quantity
    String imageUrl;     // ảnh đại diện sản phẩm
    int stockQuantity;   // tồn kho hiện tại — để FE disable nút tăng khi hết hàng
}
