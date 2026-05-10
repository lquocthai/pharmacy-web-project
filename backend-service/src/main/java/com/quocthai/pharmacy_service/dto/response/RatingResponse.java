package com.quocthai.pharmacy_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RatingResponse {
    String id;
    String userId;
    String username;
    int star;
    String comment;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    // Luôn trả về list (rỗng nếu chưa có reply) — sẵn sàng cho dược sĩ trả lời
    List<RatingReplyResponse> replies;
}
