package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.constants.RatingStatus;
import com.quocthai.pharmacy_service.dto.request.CreateRatingReplyRequest;
import com.quocthai.pharmacy_service.dto.request.CreateRatingRequest;
import com.quocthai.pharmacy_service.dto.request.UpdateRatingRequest;
import com.quocthai.pharmacy_service.dto.response.PageResponse;
import com.quocthai.pharmacy_service.dto.response.RatingReplyResponse;
import com.quocthai.pharmacy_service.dto.response.RatingResponse;
import com.quocthai.pharmacy_service.entity.Rating;
import com.quocthai.pharmacy_service.entity.RatingReply;
import com.quocthai.pharmacy_service.entity.User;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RatingService {

    RatingRepository ratingRepository;
    RatingReplyRepository ratingReplyRepository;
    ProductRepository productRepository;
    UserRepository userRepository;

    // ── Lấy email từ JWT ──────────────────────────────────────────────────────
    private String getCurrentUserEmail() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return auth.getName();
    }

    // ── Map Rating entity → RatingResponse (không có replies) ────────────────
    private RatingResponse toResponse(Rating r, List<RatingReplyResponse> replies) {
        return RatingResponse.builder()
                .id(r.getId())
                .userId(r.getUser().getId())
                .username(r.getUser().getUsername())
                .star(r.getStar())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .replies(replies)
                .build();
    }

    // ── Map RatingReply → RatingReplyResponse ─────────────────────────────────
    private RatingReplyResponse toReplyResponse(RatingReply rr) {
        return RatingReplyResponse.builder()
                .id(rr.getId())
                .repliedById(rr.getRepliedBy().getId())
                .repliedByUsername(rr.getRepliedBy().getUsername())
                .content(rr.getContent())
                .createdAt(rr.getCreatedAt())
                .build();
    }

    // ── GET /ratings/product/{productId} ─────────────────────────────────────
    @Transactional(readOnly = true)
    public PageResponse<RatingResponse> getRatingsByProduct(
            String productId, Integer star, int page, int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // Query 1: Lấy ratings + user (JOIN FETCH trong query)
        Page<Rating> ratingPage = ratingRepository.findByProductId(productId, star, pageable);

        List<Rating> ratings = ratingPage.getContent();
        if (ratings.isEmpty()) {
            return PageResponse.<RatingResponse>builder()
                    .content(Collections.emptyList())
                    .page(page).size(size)
                    .totalElements(0).totalPages(0).last(true)
                    .build();
        }

        // Query 2: Lấy tất cả replies của các ratingId trên — 1 query IN, không N+1
        List<String> ratingIds = ratings.stream().map(Rating::getId).toList();
        List<RatingReply> allReplies = ratingReplyRepository.findByRatingIds(ratingIds);

        // Build Map<ratingId, List<RatingReplyResponse>>
        Map<String, List<RatingReplyResponse>> replyMap = allReplies.stream()
                .collect(Collectors.groupingBy(
                        rr -> rr.getRating().getId(),
                        Collectors.mapping(this::toReplyResponse, Collectors.toList())
                ));

        // Map ratings → responses
        List<RatingResponse> responses = ratings.stream()
                .map(r -> toResponse(r, replyMap.getOrDefault(r.getId(), Collections.emptyList())))
                .toList();

        return PageResponse.<RatingResponse>builder()
                .content(responses)
                .page(ratingPage.getNumber())
                .size(ratingPage.getSize())
                .totalElements(ratingPage.getTotalElements())
                .totalPages(ratingPage.getTotalPages())
                .last(ratingPage.isLast())
                .build();
    }

    // ── POST /ratings ─────────────────────────────────────────────────────────
    @Transactional
    public RatingResponse createRating(CreateRatingRequest request) {
        String email = getCurrentUserEmail();

        // Kiểm tra sản phẩm tồn tại
        var product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));
//
//        // Kiểm tra đã đánh giá chưa (UNIQUE constraint)
//        ratingRepository.findByProductIdAndUserEmail(request.getProductId(), email)
//                .ifPresent(r -> { throw new AppException(ErrorCode.RATING_ALREADY_EXISTED); });

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Rating rating = Rating.builder()
                .product(product)
                .user(user)
                .star(request.getStar())
                .comment(request.getComment())
                .status(RatingStatus.ACTIVE)
                .build();

        ratingRepository.save(rating);
        return toResponse(rating, Collections.emptyList());
    }

    // ── PUT /ratings/{ratingId} ───────────────────────────────────────────────
    @Transactional
    public RatingResponse updateRating(String ratingId, UpdateRatingRequest request) {
        String email = getCurrentUserEmail();

        Rating rating = ratingRepository.findOwnedRating(ratingId, email)
                .orElseThrow(() -> new AppException(ErrorCode.RATING_NOT_EXISTED));

        rating.setStar(request.getStar());
        rating.setComment(request.getComment());

        // Lấy replies hiện tại
        List<RatingReply> replies = ratingReplyRepository.findByRatingIds(List.of(ratingId));
        List<RatingReplyResponse> replyResponses = replies.stream().map(this::toReplyResponse).toList();

        return toResponse(rating, replyResponses);
    }

    // ── DELETE /ratings/{ratingId} ────────────────────────────────────────────
    @Transactional
    public void deleteRating(String ratingId) {
        String email = getCurrentUserEmail();
        Rating rating = ratingRepository.findOwnedRating(ratingId, email)
                .orElseThrow(() -> new AppException(ErrorCode.RATING_NOT_EXISTED));
        ratingRepository.delete(rating);
    }

    // ── POST /ratings/{ratingId}/replies  ───────────────────
    @PreAuthorize("hasRole('PHARMACIST')")
    @Transactional
    public RatingResponse replyRating(String ratingId, CreateRatingReplyRequest request) {
        String email = getCurrentUserEmail();

        Rating rating = ratingRepository.findById(ratingId)
                .orElseThrow(() -> new AppException(ErrorCode.RATING_NOT_EXISTED));

        User replier = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        RatingReply reply = RatingReply.builder()
                .rating(rating)
                .repliedBy(replier)
                .content(request.getContent())
                .build();

        ratingReplyRepository.save(reply);

        // Reload replies sau khi thêm
        List<RatingReply> replies = ratingReplyRepository.findByRatingIds(List.of(ratingId));
        List<RatingReplyResponse> replyResponses = replies.stream().map(this::toReplyResponse).toList();

        return toResponse(rating, replyResponses);
    }
}
