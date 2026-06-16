package com.quocthai.pharmacy_service.dto.request;

import com.quocthai.pharmacy_service.entity.Message;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SendMessageRequest {

    @NotBlank(message = "conversationId không được trống")
    String conversationId;

    /** TEXT nếu null */
    Message.MessageType messageType;

    /** Bắt buộc với TEXT; null với IMAGE/FILE */
    String content;

    /** URL sau khi upload (dùng với IMAGE/FILE) */
    String fileUrl;

    String fileName;
}
