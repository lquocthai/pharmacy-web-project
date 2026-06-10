package com.quocthai.pharmacy_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PharmacistDashboardResponse {

    // ── Hội thoại ──────────────────────────────────────────────────────────
    long totalConversations;
    long totalUnreadMessages;

    // ── Đánh giá ───────────────────────────────────────────────────────────
    long totalRatings;
    long pendingRatings;        // HIDDEN status — chờ duyệt
    double averageRating;

    // ── Sản phẩm ───────────────────────────────────────────────────────────
    long totalProducts;
    long prescriptionProducts;
    long activeProducts;

    // ── Biểu đồ phân phối sao đánh giá ────────────────────────────────────
    List<RatingDistributionItem> ratingDistribution;

    // ── Top sản phẩm được đánh giá nhiều nhất ──────────────────────────────
    List<TopRatedProductItem> topRatedProducts;

    // ── Inner DTOs ─────────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RatingDistributionItem {
        int star;
        long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopRatedProductItem {
        String productName;
        double avgStar;
        long totalRatings;
    }
}
