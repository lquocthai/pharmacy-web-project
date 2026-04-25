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
@Table(name = "categories")
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    String id;

    @Column(nullable = false, unique = true)
    String name;

    @Column(unique = true)
    String slug; // Dùng cho URL thân thiện (ví dụ: thuc-pham-chuc-nang)

    String description;
    String icon; // Lưu class icon hoặc URL ảnh icon danh mục
}
