package com.quocthai.pharmacy_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "cart_items")
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    Cart cart;

    // ── THAY ĐỔI CỐT LÕI TẠI ĐÂY ──
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false) // Đổi từ product_id sang variant_id
    ProductVariant variant;

    // Giữ lại trường product nếu bạn muốn query nhanh sản phẩm gốc,
    // hoặc có thể bỏ qua vì variant đã có liên kết đến product.
    // Ở đây mình giữ lại để không làm lỗi logic builder cũ của bạn trong service.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    Product product;

    @Column(nullable = false)
    int quantity;

    // Lưu giá tại thời điểm thêm vào giỏ — tránh bị ảnh hưởng khi giá sản phẩm thay đổi
    @Column(nullable = false)
    BigDecimal priceAtTime;

    @Transient
    public BigDecimal getSubtotal() {

        return priceAtTime.multiply(
                BigDecimal.valueOf(quantity)
        );
    }
}
