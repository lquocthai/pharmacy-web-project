package com.quocthai.pharmacy_service.dto.response;

import com.quocthai.pharmacy_service.entity.Message;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MessageResponse {

    String id;
    String conversationId;
    String senderId;
    String senderName;
    Message.SenderRole senderRole;
    Message.MessageType messageType;
    String content;
    String fileUrl;
    String fileName;
    LocalDateTime createdAt;
}
