package com.quocthai.pharmacy_service.dto.response;

import com.quocthai.pharmacy_service.entity.Conversation;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConversationResponse {

    String id;
    String userId;
    String userDisplayName;
    String pharmacistId;
    Conversation.ConversationStatus status;
    LocalDateTime lastMessageAt;
    LocalDateTime createdAt;

    // Summary fields — populated separately to avoid N+1
    Long messageCount;
    String lastMessageContent;
    String lastMessageSenderRole;
}
