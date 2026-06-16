package com.quocthai.pharmacy_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Cuộc hội thoại tư vấn dược sĩ — Shared Inbox model (Messenger/Zalo style).
 *
 * Không còn status flow. Bất kỳ dược sĩ nào cũng có thể xem và trả lời.
 * Sắp xếp theo lastMessageAt DESC.
 */
@Entity
@Table(
    name = "conversations",
    indexes = {
        @Index(name = "idx_conv_user_id",   columnList = "userId"),
        @Index(name = "idx_conv_last_msg",  columnList = "lastMessageAt")
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

    /** Avatar URL của user */
    String userAvatarUrl;

    /** Thời gian tin nhắn cuối — dùng để sắp xếp danh sách */
    LocalDateTime lastMessageAt;

    /**
     * Số tin nhắn chưa đọc (phía dược sĩ).
     * Tăng khi USER gửi tin, reset về 0 khi dược sĩ mở conversation.
     */
    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    int unreadCount;

    @Column(nullable = false, updatable = false)
    LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (lastMessageAt == null) lastMessageAt = now;
    }
}
