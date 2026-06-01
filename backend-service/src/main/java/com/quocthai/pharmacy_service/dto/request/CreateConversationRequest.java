package com.quocthai.pharmacy_service.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateConversationRequest {

    /** Câu hỏi / lý do tư vấn ban đầu của người dùng (tuỳ chọn) */
    String initialMessage;
}
