package com.quocthai.pharmacy_service.entity;

import com.quocthai.pharmacy_service.constants.InventoryTransactionType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "inventory_transactions")
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne
    @JoinColumn(name = "batch_id")
    InventoryBatch batch;

    @ManyToOne
    @JoinColumn(name = "variant_id")
    ProductVariant variant;

    @Enumerated(EnumType.STRING)
    InventoryTransactionType type;

    Integer quantity;

    // order id / import receipt id
    String referenceId;

    @org.hibernate.annotations.CreationTimestamp // Tự động điền thời gian tạo
    @Column(updatable = false)
    LocalDateTime createdAt;
}