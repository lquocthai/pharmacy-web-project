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
@Table(name = "order_items")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    Order order;

    // FK giữ để tra cứu sản phẩm, nhưng snapshot tên/giá để tránh mất dữ liệu
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    Product product;

    // ── Snapshot tại thời điểm đặt ─────────────────────────────────────────────
    @Column(nullable = false)
    String productName;

    String productSlug;
    String imageUrl;
    String unit;

    @Column(nullable = false)
    int quantity;

    @Column(nullable = false)
    BigDecimal priceAtTime;

    @Column(nullable = false)
    BigDecimal subtotal; // priceAtTime * quantity
}
