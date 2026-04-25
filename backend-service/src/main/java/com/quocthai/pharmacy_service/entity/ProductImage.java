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
@Table(name = "product_images")
public class ProductImage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String imageUrl;
    boolean isPrimary; // Ảnh chính để hiển thị ở trang danh sách

    @ManyToOne
    @JoinColumn(name = "product_id")
    Product product;
}
