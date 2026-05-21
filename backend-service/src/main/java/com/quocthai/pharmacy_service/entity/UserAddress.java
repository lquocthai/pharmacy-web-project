package com.quocthai.pharmacy_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "user_addresses")
public class UserAddress {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @Column(nullable = false)
    String fullName;    // Tên người nhận

    @Column(nullable = false)
    String phone;       // SĐT người nhận

    @Column(nullable = false)
    String province;    // Tỉnh/Thành phố

    @Column(nullable = false)
    String district;    // Quận/Huyện

    @Column(nullable = false)
    String ward;        // Phường/Xã

    @Column(nullable = false)
    String addressDetail; // Số nhà, tên đường

    @Column(nullable = false)
    int provinceId;    // Tỉnh/Thành phố

    @Column(nullable = false)
    int districtId;    // Quận/Huyện

    @Column(nullable = false)
    String wardCode;        // Phường/Xã

    @Builder.Default
    boolean isDefault = false; // Địa chỉ mặc định

    String label;

    @CreationTimestamp
    LocalDateTime createdAt;

    @UpdateTimestamp
    LocalDateTime updatedAt;
}
