package com.quocthai.pharmacy_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity

public class Inventory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    // SỬA TẠI ĐÂY: Nhiều lô hàng trỏ về một sản phẩm
    @ManyToOne
    @JoinColumn(name = "product_id")
    Product product;

    String batchNumber;   // Số lô (Ví dụ: BN20240501)
    LocalDate expiryDate;  // Hạn sử dụng của riêng lô này

    int stockQuantity;    // Số lượng tồn kho của riêng lô này
    int lowStockThreshold; // Ngưỡng cảnh báo cho lô này (hoặc tổng kho)

    @UpdateTimestamp
    LocalDateTime lastStockUpdate;
}