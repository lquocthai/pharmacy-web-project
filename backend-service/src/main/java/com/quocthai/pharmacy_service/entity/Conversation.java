package com.quocthai.pharmacy_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Cuộc hội thoại tư vấn dược sĩ.
 *
 * Status flow:
 *   PENDING → IN_PROGRESS (dược sĩ claim)
 *   IN_PROGRESS → RESOLVED (dược sĩ mark resolved)
 *   RESOLVED → PENDING (user nhắn lại)
 *   RESOLVED / PENDING → CLOSED (user bấm kết thúc, hoặc scheduler 7 ngày không hoạt động)
 */
@Entity
@Table(
    name = "conversations",
    indexes = {
        @Index(name = "idx_conv_user_status", columnList = "userId, status"),
        @Index(name = "idx_conv_status",      columnList = "status"),
        @Index(name = "idx_conv_last_msg",    columnList = "lastMessageAt")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    /** ID (PK) của user — lấy từ User.id */
    @Column(nullable = false)
    String userId;

    /** Username hiển thị của user (snapshot tại thời điểm tạo) */
    String userDisplayName;

    /** ID của dược sĩ đã nhận tư vấn — null khi PENDING */
    String pharmacistId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    ConversationStatus status;

    LocalDateTime lastMessageAt;

    @Column(nullable = false, updatable = false)
    LocalDateTime createdAt;

    LocalDateTime updatedAt;

    /** Optimistic lock — chống 2 dược sĩ claim đồng thời */
    @Version
    Long version;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (lastMessageAt == null) lastMessageAt = now;
        if (status == null) status = ConversationStatus.PENDING;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ConversationStatus {
        PENDING,
        IN_PROGRESS,
        RESOLVED,
        CLOSED
    }
}
