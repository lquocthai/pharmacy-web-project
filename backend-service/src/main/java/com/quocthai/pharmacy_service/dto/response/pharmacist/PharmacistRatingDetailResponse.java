package com.quocthai.pharmacy_service.dto.response.pharmacist;

import com.quocthai.pharmacy_service.constants.RatingStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PharmacistRatingDetailResponse {
    String productId;
    String productName;
    String productImage;
    String userId;
    String userFullName;
    int star;
    String comment;
    RatingStatus status;
    LocalDateTime createdAt;
    List<RatingReplyInfo> replies;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class RatingReplyInfo {
        String replyId;
        String content;
        String pharmacistId;
        String pharmacistName;
        LocalDateTime createdAt;
    }
}
