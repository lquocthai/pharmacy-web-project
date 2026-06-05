package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.dto.request.CreateRatingReplyRequest;
import com.quocthai.pharmacy_service.dto.request.CreateRatingRequest;
import com.quocthai.pharmacy_service.dto.request.UpdateRatingRequest;
import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.PageResponse;
import com.quocthai.pharmacy_service.dto.response.RatingResponse;
import com.quocthai.pharmacy_service.service.RatingService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/ratings")
public class RatingController {

    RatingService ratingService;

    /**
     * GET /ratings/product/{productId}
     * Lấy danh sách đánh giá theo sản phẩm, hỗ trợ lọc theo sao và phân trang.
     * Public — không cần đăng nhập.
     *
     * @param star  lọc theo số sao (1-5), null = lấy tất cả
     * @param page  trang hiện tại (mặc định 0)
     * @param size  số đánh giá mỗi trang (mặc định 10)
     */
    @GetMapping("/product/{productId}")
    ApiResponse<PageResponse<RatingResponse>> getRatingsByProduct(
            @PathVariable String productId,
            @RequestParam(required = false) Integer star,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        log.info("GET /ratings/product/{} - star={}, page={}, size={}", productId, star, page, size);
        return ApiResponse.<PageResponse<RatingResponse>>builder()
                .result(ratingService.getRatingsByProduct(productId, star, page, size))
                .build();
    }

    /**
     * POST /ratings
     * Tạo đánh giá mới — cần đăng nhập.
     */
    @PostMapping
    ApiResponse<RatingResponse> createRating(@RequestBody @Valid CreateRatingRequest request) {
        log.info("POST /ratings - productId={}, star={}", request.getProductId(), request.getStar());
        return ApiResponse.<RatingResponse>builder()
                .result(ratingService.createRating(request))
                .build();
    }

    /**
     * PUT /ratings/{ratingId}
     * Sửa đánh giá — chỉ chủ sở hữu.
     */
    @PutMapping("/{ratingId}")
    ApiResponse<RatingResponse> updateRating(
            @PathVariable String ratingId,
            @RequestBody @Valid UpdateRatingRequest request
    ) {
        log.info("PUT /ratings/{}", ratingId);
        return ApiResponse.<RatingResponse>builder()
                .result(ratingService.updateRating(ratingId, request))
                .build();
    }

    /**
     * DELETE /ratings/{ratingId}
     * Xóa đánh giá — chỉ chủ sở hữu.
     */
    @DeleteMapping("/{ratingId}")
    ApiResponse<Void> deleteRating(@PathVariable String ratingId) {
        log.info("DELETE /ratings/{}", ratingId);
        ratingService.deleteRating(ratingId);
        return ApiResponse.<Void>builder()
                .message("Đã xóa đánh giá")
                .build();
    }


}
