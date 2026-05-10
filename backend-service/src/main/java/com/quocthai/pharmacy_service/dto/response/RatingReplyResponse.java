package com.quocthai.pharmacy_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RatingReplyResponse {
    String id;
    String repliedById;
    String repliedByUsername;   // tên dược sĩ hiển thị
    String content;
    LocalDateTime createdAt;
}
