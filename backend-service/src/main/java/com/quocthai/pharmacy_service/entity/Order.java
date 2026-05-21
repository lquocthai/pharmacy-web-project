package com.quocthai.pharmacy_service.entity;

import com.quocthai.pharmacy_service.constants.OrderStatus;
import com.quocthai.pharmacy_service.constants.PaymentMethod;
import com.quocthai.pharmacy_service.constants.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "orders",
        indexes = {
                @Index(name = "idx_order_user", columnList = "user_id"),
                @Index(name = "idx_order_status", columnList = "status"),
                @Index(name = "idx_order_created", columnList = "createdAt")
        })
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(unique = true, nullable = false)
    String orderCode; // VD: QT-20240512-0001

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    OrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    // ── Money ─────────────────────────────────────────────────────────────────
    @Column(nullable = false, precision = 15, scale = 2)
    BigDecimal totalAmount;

    @Column(nullable = false, precision = 15, scale = 2)
    BigDecimal shippingFee;

    @Column(nullable = false, precision = 15, scale = 2)
    BigDecimal finalAmount;

    @Column(columnDefinition = "TEXT")
    String note;

    // ── Snapshot địa chỉ giao hàng tại thời điểm đặt ──────────────────────────
    // Không dùng FK để tránh mất dữ liệu khi user xóa địa chỉ
    @Column(nullable = false)
    String shippingFullName;

    @Column(nullable = false)
    String shippingPhone;

    @Column(nullable = false)
    String shippingProvince;

    @Column(nullable = false)
    String shippingDistrict;

    @Column(nullable = false)
    String shippingWard;

    @Column(nullable = false)
    String shippingAddressDetail;

    // ── Quan hệ ────────────────────────────────────────────────────────────────
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<OrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<OrderStatusHistory> statusHistory = new ArrayList<>();

    // ── Timestamps ─────────────────────────────────────────────────────────────
    @CreationTimestamp
    LocalDateTime createdAt;

    @UpdateTimestamp
    LocalDateTime updatedAt;

    LocalDateTime cancelledAt;

    @Column(columnDefinition = "TEXT")
    String cancelReason;

    // Mã giao dịch thanh toán (từ MoMo/VNPay/bank)
    String paymentTransactionId;

    // Thời điểm thanh toán thành công
    LocalDateTime paidAt;
}
