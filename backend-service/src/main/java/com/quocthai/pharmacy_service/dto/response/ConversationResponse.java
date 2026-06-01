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
    String pharmacistId;
    Conversation.ConversationStatus status;
    LocalDateTime lastMessageAt;
    LocalDateTime createdAt;
}
