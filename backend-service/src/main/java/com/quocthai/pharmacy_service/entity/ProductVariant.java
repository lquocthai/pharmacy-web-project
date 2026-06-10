package com.quocthai.pharmacy_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "product_variants")
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne
    @JoinColumn(name = "product_id")
    Product product;

    @Column(unique = true)
    String sku;

    // Hộp 100 viên
    // Vỉ 10 viên
    String variantName;

    BigDecimal price;

    BigDecimal originalPrice;

    boolean active;

    boolean variantDefault = false;

    @OneToMany(
            mappedBy = "variant",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    List<InventoryBatch> inventoryBatches = new ArrayList<>();
}