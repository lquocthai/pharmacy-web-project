package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.constants.RatingStatus;
import com.quocthai.pharmacy_service.dto.response.PharmacistDashboardResponse;
import com.quocthai.pharmacy_service.repository.ConversationRepository;
import com.quocthai.pharmacy_service.repository.ProductRepository;
import com.quocthai.pharmacy_service.repository.RatingRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PharmacistDashboardService {

    ConversationRepository conversationRepository;
    RatingRepository ratingRepository;
    ProductRepository productRepository;

    @PreAuthorize("hasRole('PHARMACIST')")
    @Transactional(readOnly = true)
    public PharmacistDashboardResponse getDashboard() {

        // ── Hội thoại ──────────────────────────────────────────────────────
        long totalConversations   = conversationRepository.count();
        long totalUnreadMessages  = conversationRepository.sumTotalUnreadMessages();

        // ── Đánh giá ───────────────────────────────────────────────────────
        long totalRatings   = ratingRepository.countByStatus(RatingStatus.ACTIVE);
        long pendingRatings = ratingRepository.countByStatus(RatingStatus.HIDDEN);
        double averageRating = ratingRepository.getAverageRating(RatingStatus.ACTIVE);

        // ── Sản phẩm ───────────────────────────────────────────────────────
        long totalProducts        = productRepository.count();
        long prescriptionProducts = productRepository.countByIsPrescriptionTrue();
        long activeProducts       = productRepository.countByActiveTrue();

        // ── Phân phối sao ─────────────────────────────────────────────────
        List<PharmacistDashboardResponse.RatingDistributionItem> ratingDistribution =
                ratingRepository.getRatingDistribution(RatingStatus.ACTIVE)
                        .stream()
                        .map(row -> PharmacistDashboardResponse.RatingDistributionItem.builder()
                                .star(((Number) row[0]).intValue())
                                .count(((Number) row[1]).longValue())
                                .build())
                        .toList();

        // ── Top sản phẩm được đánh giá (top 5) ───────────────────────────
        List<PharmacistDashboardResponse.TopRatedProductItem> topRatedProducts =
                ratingRepository.getTopRatedProducts(RatingStatus.ACTIVE,PageRequest.of(0, 5))
                        .stream()
                        .map(row -> PharmacistDashboardResponse.TopRatedProductItem.builder()
                                .productName((String) row[0])
                                .avgStar(((Number) row[1]).doubleValue())
                                .totalRatings(((Number) row[2]).longValue())
                                .build())
                        .toList();

        return PharmacistDashboardResponse.builder()
                .totalConversations(totalConversations)
                .totalUnreadMessages(totalUnreadMessages)
                .totalRatings(totalRatings)
                .pendingRatings(pendingRatings)
                .averageRating(Math.round(averageRating * 10.0) / 10.0)
                .totalProducts(totalProducts)
                .prescriptionProducts(prescriptionProducts)
                .activeProducts(activeProducts)
                .ratingDistribution(ratingDistribution)
                .topRatedProducts(topRatedProducts)
                .build();
    }
}
