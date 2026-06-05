package com.quocthai.pharmacy_service.controller.pharmacist;

import com.quocthai.pharmacy_service.constants.RatingStatus;
import com.quocthai.pharmacy_service.dto.request.CreateRatingReplyRequest;
import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.PageResponse;
import com.quocthai.pharmacy_service.dto.response.RatingResponse;
import com.quocthai.pharmacy_service.dto.response.pharmacist.PharmacistRatingDetailResponse;
import com.quocthai.pharmacy_service.dto.response.pharmacist.PharmacistRatingListResponse;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.service.PharmacistRatingService;
import com.quocthai.pharmacy_service.service.RatingService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Slf4j
@RestController
@RequestMapping("/pharmacist/ratings")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PharmacistRatingController {

    PharmacistRatingService pharmacistRatingService;
    RatingService ratingService;

    /**
     * GET /pharmacist/ratings
     * Lấy danh sách đánh giá — chỉ PHARMACIST.
     *
     * @param status      lọc theo trạng thái (ACTIVE / HIDDEN), null = tất cả
     * @param star        lọc theo số sao (1-5), null = tất cả
     * @param productName lọc theo tên sản phẩm, null = tất cả
     * @param fromDate    lọc từ ngày (ISO date), null = không giới hạn
     * @param toDate      lọc đến ngày (ISO date), null = không giới hạn
     * @param page        trang hiện tại (mặc định 0)
     * @param size        số bản ghi mỗi trang (mặc định 10)
     */
    @GetMapping
    public ApiResponse<PageResponse<PharmacistRatingListResponse>> getRatings(
            @RequestParam(required = false) RatingStatus status,
            @RequestParam(required = false) Integer star,
            @RequestParam(required = false) String productName,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        if (star != null && (star < 1 || star > 5)) throw new AppException(ErrorCode.RATING_STAR_INVALID);
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) throw new AppException(ErrorCode.INVALID_REQUEST);

        log.info("GET /pharmacist/ratings - status={}, star={}, productName={}, fromDate={}, toDate={}, page={}, size={}",
                status, star, productName, fromDate, toDate, page, size);

        return ApiResponse.<PageResponse<PharmacistRatingListResponse>>builder()
                .result(pharmacistRatingService.getRatings(status, star, productName, fromDate, toDate, page, size))
                .build();
    }

    /**
     * GET /pharmacist/ratings/{ratingId}
     * Lấy chi tiết một đánh giá — chỉ PHARMACIST.
     *
     * @param ratingId ID của đánh giá
     */
    @GetMapping("/{ratingId}")
    public ApiResponse<PharmacistRatingDetailResponse> getRatingDetail(@PathVariable String ratingId) {
        log.info("GET /pharmacist/ratings/{}", ratingId);

        return ApiResponse.<PharmacistRatingDetailResponse>builder()
                .result(pharmacistRatingService.getRatingDetail(ratingId))
                .build();
    }
    /**
     * POST /ratings/{ratingId}/replies
     * Dược sĩ trả lời đánh giá — cần đăng nhập (ROLE_PHARMACIST kiểm tra ở service hoặc @PreAuthorize).
     */
    @PostMapping("/{ratingId}/replies")
    ApiResponse<RatingResponse> replyRating(
            @PathVariable String ratingId,
            @RequestBody @Valid CreateRatingReplyRequest request
    ) {
        log.info("POST /ratings/{}/replies", ratingId);
        return ApiResponse.<RatingResponse>builder()
                .result(ratingService.replyRating(ratingId, request))
                .build();
    }
}
