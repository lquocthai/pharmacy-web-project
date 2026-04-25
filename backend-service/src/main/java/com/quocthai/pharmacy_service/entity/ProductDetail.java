package com.quocthai.pharmacy_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "product_details")
public class ProductDetail {
    @Id
    @Column(name = "product_id")
    String id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "product_id", columnDefinition = "VARCHAR(36)") // Khớp với UUID của Product
    Product product;

    @Column(name = "usage_instruction", columnDefinition = "TEXT")
    String usage;
    // tác dụng phụ
    @Column(columnDefinition = "TEXT")
    String sideEffects;
    // chống chỉ định, lưu ý
    @Column(columnDefinition = "TEXT")
    String contraindications;
    // bảo quản
    @Column(columnDefinition = "TEXT")
    String storage;
    // thành phần
    @Column(columnDefinition = "TEXT")
    String composition;
    // mô tả
    @Column(columnDefinition = "TEXT")
    String description;
}
