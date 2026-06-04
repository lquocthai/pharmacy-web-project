package com.quocthai.pharmacy_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Gửi về /user/queue/errors khi WebSocket handler bắt lỗi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WsErrorResponse {
    int code;
    String message;
}
