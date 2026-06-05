package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.constants.RatingStatus;
import com.quocthai.pharmacy_service.dto.response.PageResponse;
import com.quocthai.pharmacy_service.dto.response.pharmacist.PharmacistRatingDetailResponse;
import com.quocthai.pharmacy_service.dto.response.pharmacist.PharmacistRatingListResponse;
import com.quocthai.pharmacy_service.entity.ProductImage;
import com.quocthai.pharmacy_service.entity.Rating;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.mapper.PharmacistRatingMapper;
import com.quocthai.pharmacy_service.repository.PharmacistRatingRepository;
import com.quocthai.pharmacy_service.repository.ProductImageRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PharmacistRatingService {

    PharmacistRatingRepository pharmacistRatingRepository;
    PharmacistRatingMapper pharmacistRatingMapper;

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('PHARMACIST')")
    public PageResponse<PharmacistRatingListResponse> getRatings(
            RatingStatus status,
            Integer star,
            String productName,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size) {

        LocalDateTime fromDateTime = (fromDate != null) ? fromDate.atStartOfDay() : null;
        LocalDateTime toDateTime = (toDate != null) ? toDate.atTime(23, 59, 59, 999_000_000) : null;

        Pageable pageable = PageRequest.of(page, size);

        Page<Rating> ratingPage = pharmacistRatingRepository.findForPharmacist(
                status, star, productName, fromDateTime, toDateTime, pageable);

        List<PharmacistRatingListResponse> content = ratingPage.getContent().stream()
                .map(pharmacistRatingMapper::toListResponse)
                .toList();

        return PageResponse.<PharmacistRatingListResponse>builder()
                .content(content)
                .page(ratingPage.getNumber())
                .size(ratingPage.getSize())
                .totalElements(ratingPage.getTotalElements())
                .totalPages(ratingPage.getTotalPages())
                .last(ratingPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('PHARMACIST')")
    public PharmacistRatingDetailResponse getRatingDetail(String ratingId) {
        Rating rating = pharmacistRatingRepository.findDetailById(ratingId)
                .orElseThrow(() -> new AppException(ErrorCode.RATING_NOT_EXISTED));


        return pharmacistRatingMapper.toDetailResponse(rating);
    }
}
