package com.quocthai.pharmacy_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL,  fetch = FetchType.LAZY)
    List<ProductImage> images = new ArrayList<>();

    // Variants
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL,  fetch = FetchType.LAZY)
    List<ProductVariant> variants = new ArrayList<>();

    // Specifications động
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL,  fetch = FetchType.LAZY)
    List<ProductSpecification> specifications = new ArrayList<>();

    // triệu chứng — dữ liệu thuộc về Product, không cần entity riêng
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "product_symptoms",
            joinColumns = @JoinColumn(name = "product_id")
    )
    @Column(name = "symptom")
    Set<String> symptoms = new HashSet<>();

    @CreationTimestamp
    LocalDateTime createdAt;

    // Trong file Product.java của bạn
    public void setPriceDefault() {
        if (this.variants != null && !this.variants.isEmpty()) {
            // Tìm variant nào có variantDefault == true
            this.priceDefault = this.variants.stream()
                    .filter(ProductVariant::isVariantDefault) // Hoặc .isVariantDefault() tùy bạn đặt getter
                    .map(ProductVariant::getPrice)
                    .findFirst()
                    // Nếu lỡ không có variant nào để mặc định, lấy tạm giá của variant đầu tiên
                    .orElse(this.variants.get(0).getPrice());
        }
    }
}