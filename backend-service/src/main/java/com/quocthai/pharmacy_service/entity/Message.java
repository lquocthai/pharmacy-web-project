package com.quocthai.pharmacy_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "messages",
    indexes = {
        @Index(name = "idx_msg_conversation_created", columnList = "conversationId, createdAt")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false)
    String conversationId;

    String senderId;

    String senderDisplayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    SenderRole senderRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    MessageType messageType;

    String fileUrl;
    String fileName;

    @Column(columnDefinition = "TEXT")
    String content;

    @Column(nullable = false, updatable = false)
    LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (messageType == null) messageType = MessageType.TEXT;
    }

    public enum SenderRole {
        USER,
        PHARMACIST,
        BOT,
        ADMIN
    }

    public enum MessageType {
        TEXT,
        IMAGE,
        FILE
    }
}
