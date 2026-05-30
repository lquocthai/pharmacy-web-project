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
public class ChatMessageResponse {

    private String id;
    private String conversationId;

    private String senderId;
    private Message.SenderRole senderRole;

    private Message.MessageType messageType;

    private String content;

    private String fileUrl;
    private String fileName;

    private LocalDateTime createdAt;
}
