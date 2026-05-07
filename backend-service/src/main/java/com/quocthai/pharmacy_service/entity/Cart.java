package com.quocthai.pharmacy_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "carts")
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    // Quan hệ 1-1 với User — mỗi user chỉ có 1 giỏ hàng
    @OneToOne
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    User user;

    // Quan hệ 1-N với CartItem
    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<CartItem> items = new ArrayList<>();

    @CreationTimestamp
    LocalDateTime createdAt;

    // Helper method để tính tổng tiền
    public double getTotalAmount() {
        return items.stream()
                .mapToDouble(CartItem::getSubtotal)
                .sum();
    }

    public int getTotalItems() { // số loại sản phẩm
        return items.size();
    }

    public int getTotalQuantity() { // tổng số lượng
        return items.stream()
                .mapToInt(CartItem::getQuantity)
                .sum();
    }

}
