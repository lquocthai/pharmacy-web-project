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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
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
