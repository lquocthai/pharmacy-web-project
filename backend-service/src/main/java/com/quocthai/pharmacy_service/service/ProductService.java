package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.dto.response.PageResponse;
import com.quocthai.pharmacy_service.dto.response.ProductSummaryResponse;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.mapper.ProductMapper;
import com.quocthai.pharmacy_service.repository.ProductRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProductService {

    ProductRepository productRepository;
    ProductMapper productMapper;

    /**
     * Lấy danh sách sản phẩm theo category slug với phân trang.
     *
     * @param slug     slug của category (vd: thuc-pham-chuc-nang)
     * @param page     trang hiện tại (bắt đầu từ 0)
     * @param size     số sản phẩm mỗi trang (mặc định 20, tối đa 100)
     * @param sortBy   field để sort (mặc định: name)
     * @param sortDir  hướng sort: asc | desc
     */
    @Transactional(readOnly = true)
    public PageResponse<ProductSummaryResponse> getProductsByCategory(
            String slug, int page, int size, String sortBy, String sortDir) {

        // Giới hạn size để tránh query quá lớn
        int safeSize = Math.min(size, 100);

        // Chỉ cho phép sort theo các field hợp lệ — tránh SQL injection qua sortBy
        String safeSortBy = switch (sortBy) {
            case "price", "name", "manufacturer" -> sortBy;
            default -> "name";
        };

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(safeSortBy).descending()
                : Sort.by(safeSortBy).ascending();

        Pageable pageable = PageRequest.of(page, safeSize, sort);

        Page<ProductSummaryResponse> resultPage = productRepository
                .findByCategorySlug(slug, pageable)
                .map(productMapper::toSummaryResponse);

        if (resultPage.isEmpty()) {
            log.warn("Không tìm thấy sản phẩm nào cho category slug: {}", slug);
        }

        return PageResponse.<ProductSummaryResponse>builder()
                .content(resultPage.getContent())
                .page(resultPage.getNumber())
                .size(resultPage.getSize())
                .totalElements(resultPage.getTotalElements())
                .totalPages(resultPage.getTotalPages())
                .last(resultPage.isLast())
                .build();
    }
}
