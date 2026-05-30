package com.quocthai.pharmacy_service.entity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String conversationId;

    String senderId;

    @Enumerated(EnumType.STRING)
    SenderRole senderRole;

    @Enumerated(EnumType.STRING)
    MessageType messageType;

     String fileUrl;
     String fileName;

    @Column(columnDefinition = "TEXT")
    String content;

    LocalDateTime createdAt;
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
