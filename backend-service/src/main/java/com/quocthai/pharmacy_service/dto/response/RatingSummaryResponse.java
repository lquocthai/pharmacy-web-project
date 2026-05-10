package com.quocthai.pharmacy_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RatingSummaryResponse {
    double averageRating;                // điểm trung bình (làm tròn 1 chữ số thập phân)
    long totalRatings;                   // tổng số đánh giá
    Map<Integer, Long> ratingBreakdown;  // { 1: n, 2: n, 3: n, 4: n, 5: n }
}
