package com.quocthai.pharmacy_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "inventory_batches")
public class InventoryBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    // QUAN TRỌNG:
    // phải là variant
    @ManyToOne
    @JoinColumn(name = "variant_id")
    ProductVariant variant;

    // Số lô
    String batchNumber;

    // Hạn dùng
    LocalDate expiryDate;

    // Ngày sản xuất
    LocalDate manufactureDate;

    // Giá nhập của lô
    BigDecimal importPrice;

    // Tồn kho còn lại
    Integer remainingQuantity;

    Integer lowStockThreshold;

    @UpdateTimestamp
    LocalDateTime lastStockUpdate;
}