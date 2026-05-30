package com.quocthai.pharmacy_service.dto.request;
import com.quocthai.pharmacy_service.entity.Message;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessageRequest {

    private String conversationId;

    private String senderId;
    private String senderName;

    private Message.SenderRole senderRole;

    private Message.MessageType messageType;

    private String content;

    private String fileUrl;
    private String fileName;
}