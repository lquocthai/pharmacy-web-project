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
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String name;

    @Column(unique = true)
    String slug;
    BigDecimal priceDefault;
    boolean isPrescription;
    @Column(columnDefinition = "LONGTEXT")
    String description;
    String manufacturer;
    String country;
    boolean active;

    // Ví dụ:
    // Thuốc giảm đau, vitamin,...
    @ManyToOne
    @JoinColumn(name = "category_id")
    Category category;

    // Ảnh dùng chung
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL,  fetch = FetchType.LAZY,orphanRemoval = true)
    List<ProductImage> images = new ArrayList<>();

    // Variants
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL,  fetch = FetchType.LAZY,orphanRemoval = true)
    List<ProductVariant> variants = new ArrayList<>();

    // Specifications động
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL,  fetch = FetchType.LAZY,orphanRemoval = true)
    List<ProductSpecification> specifications = new ArrayList<>();
}