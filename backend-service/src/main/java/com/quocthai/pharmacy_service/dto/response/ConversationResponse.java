package com.quocthai.pharmacy_service.dto.response;

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
    String userAvatarUrl;
    LocalDateTime lastMessageAt;
    LocalDateTime createdAt;

    // Summary fields — populated separately to avoid N+1
    Long messageCount;
    String lastMessageContent;
    String lastMessageSenderRole;

    /** Số tin nhắn chưa đọc (phía dược sĩ) */
    int unreadCount;
}
