package com.quocthai.pharmacy_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false)
    String name;

    @Column(unique = true)
    String slug;

    double price;
    double oldPrice;
    String unit;

    boolean isPrescription;
    String manufacturer;
    String country;

    @ManyToOne
    @JoinColumn(name = "category_id")
    Category category;

    // Quan hệ 1-1 với bảng chi tiết
    @OneToOne(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    ProductDetail productDetail;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    List<Inventory> inventories;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    List<ProductImage> images;
}