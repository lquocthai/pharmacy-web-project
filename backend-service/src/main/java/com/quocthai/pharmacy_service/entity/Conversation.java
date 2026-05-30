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

    String userId;

    String pharmacistId;
    String adminId;

    @Enumerated(EnumType.STRING)
    ConversationStatus status;

    LocalDateTime lastMessageAt;
     LocalDateTime createdAt;

     LocalDateTime updatedAt;

    @Version
    Integer version;

    public enum ConversationStatus {
        PENDING,
        IN_PROGRESS,
        RESOLVED,
        CLOSED
    }
}