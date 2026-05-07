package com.quocthai.pharmacy_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

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
    double price;        // giá hiện tại của sản phẩm
    double priceAtTime;  // giá lúc thêm vào giỏ
    int quantity;
    double subtotal;     // priceAtTime * quantity
    String imageUrl;     // ảnh đại diện sản phẩm
    int stockQuantity;   // tồn kho hiện tại — để FE disable nút tăng khi hết hàng
}
