package com.quocthai.pharmacy_service.dto.request;

import com.quocthai.pharmacy_service.entity.Message;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessageRequest {

    String conversationId;

    /** ID của người gửi — nếu null sẽ được lấy từ JWT principal */
    String senderId;

    /** Tên hiển thị của người gửi (tuỳ chọn, dùng để hiển thị trên UI) */
    String senderName;

    Message.SenderRole senderRole;

    Message.MessageType messageType;

    /** Nội dung text (với messageType = TEXT) */
    String content;

    /** URL file đã upload (với messageType = IMAGE hoặc FILE) */
    String fileUrl;

    /** Tên file gốc */
    String fileName;
}
