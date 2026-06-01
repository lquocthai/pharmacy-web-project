package com.quocthai.pharmacy_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    /** ID của user đang tư vấn */
    String userId;

    /** ID dược sĩ đã nhận tư vấn (null khi PENDING) */
    String pharmacistId;

    String adminId;

    @Enumerated(EnumType.STRING)
    ConversationStatus status;

    LocalDateTime lastMessageAt;

    LocalDateTime createdAt;

    LocalDateTime updatedAt;

    /** Optimistic lock — dùng Long để tránh overflow */
    @Version
    Long version;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (lastMessageAt == null) lastMessageAt = now;
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
