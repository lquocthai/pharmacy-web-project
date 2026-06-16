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
    String id;               // ID của CartItem
    String productId;        // ID của sản phẩm gốc (Dùng để click điều hướng về trang chi tiết)
    String productName;      // Tên sản phẩm gốc (Ví dụ: Thuốc giảm đau Panadol Extra)
    String productSlug;
    String variantId;        // ID của biến thể cụ thể
    String sku;              // Mã SKU (Ví dụ: GSK-PND-H100)
    String variantName;      // Tên phân loại (Ví dụ: Hộp 100 viên, Vỉ 10 viên)
    BigDecimal price;        // Giá bán hiện tại của biến thể này
    BigDecimal priceAtTime;  // Giá biến thể lúc bấm thêm vào giỏ
    int quantity;
    BigDecimal subtotal;     // priceAtTime * quantity
    String imageUrl;         // Ảnh riêng của biến thể (hoặc ảnh gốc nếu biến thể không có ảnh)
    int stockQuantity;       // Tổng tồn kho hiện tại trên tất cả các lô khả dụng của SKU này
}