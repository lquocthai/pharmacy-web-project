package com.quocthai.pharmacy_service.dto.response.pharmacist;

import com.quocthai.pharmacy_service.constants.RatingStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PharmacistRatingListResponse {
    String id;
    String productId;
    String productName;
    String productImage;
    String userId;
    String userName;
    int star;
    RatingStatus status;
    LocalDateTime createdAt;
}
