package com.quocthai.pharmacy_service.entity;

import com.quocthai.pharmacy_service.constants.OrderStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "order_status_history",
        indexes = {
                @Index(name = "idx_history_order", columnList = "order_id")
        })
public class OrderStatusHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    Order order;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    OrderStatus status;

    @Column(columnDefinition = "TEXT")
    String note;

    String changedBy; // email của người thay đổi (user/admin/system)

    @CreationTimestamp
    LocalDateTime changedAt;
}
