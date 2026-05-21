package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.dto.response.*;
import com.quocthai.pharmacy_service.entity.Product;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.mapper.ProductMapper;
import com.quocthai.pharmacy_service.repository.InventoryRepository;
import com.quocthai.pharmacy_service.repository.ProductImageRepository;
import com.quocthai.pharmacy_service.repository.ProductRepository;
import com.quocthai.pharmacy_service.repository.RatingRepository;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProductService {

    ProductRepository productRepository;
    ProductMapper productMapper;
    InventoryRepository inventoryRepository;
    ProductImageRepository productImageRepository;
    RatingRepository ratingRepository;

    @Transactional(readOnly = true)
    public PageResponse<ProductSummaryResponse> getProductsByCategory(
            String slug, int page, int size, String sortBy, String sortDir) {

        int safeSize = Math.min(size, 100);
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

    /**
     * Lấy chi tiết sản phẩm theo slug.
     * Tách thành 3 query riêng để tránh MultiBag + N+1:
     *   Query 1: Product + Category + ProductDetail (findBySlugWithDetail)
     *   Query 2: Tất cả ảnh của product (findAllByProductId)
     *   Query 3: Tổng tồn kho (getTotalStockByProductId)
     *   Query 4: Rating breakdown aggregate (getRatingBreakdown)
     */
    @Transactional(readOnly = true)
    public ProductDetailResponse getProductDetail(String slug) {
        // Query 1: Product + Category + ProductDetail
        Product product = productRepository.findBySlugWithDetail(slug)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_SLUG_NOT_EXISTED));

        // Query 2: Tất cả ảnh
        List<ProductImageResponse> images = productImageRepository
                .findAllByProductId(product.getId())
                .stream()
                .map(img -> ProductImageResponse.builder()
                        .id(img.getId())
                        .imageUrl(img.getImageUrl())
                        .isPrimary(img.isPrimary())
                        .build())
                .toList();

        // Query 3: Tổng tồn kho
        int stock = inventoryRepository.getTotalStockByProductId(product.getId());

        // Query 4: Rating breakdown — 1 query aggregate, không N+1
        RatingSummaryResponse ratingSummary = buildRatingSummary(product.getId());

        // Map ProductDetail
        ProductDetailInfoResponse detailInfo = null;
        if (product.getProductDetail() != null) {
            var pd = product.getProductDetail();
            detailInfo = ProductDetailInfoResponse.builder()
                    .usage(pd.getUsage())
                    .sideEffects(pd.getSideEffects())
                    .contraindications(pd.getContraindications())
                    .storage(pd.getStorage())
                    .composition(pd.getComposition())
                    .description(pd.getDescription())
                    .build();
        }

        return ProductDetailResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .price(product.getPrice())
                .oldPrice(product.getOldPrice())
                .unit(product.getUnit())
                .isPrescription(product.isPrescription())
                .manufacturer(product.getManufacturer())
                .country(product.getCountry())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .categorySlug(product.getCategory() != null ? product.getCategory().getSlug() : null)
                .images(images)
                .detail(detailInfo)
                .stockQuantity(stock)
                .ratingSummary(ratingSummary)
                .build();
    }

    // ── Helper: tính rating summary từ breakdown aggregate ───────────────────
    private RatingSummaryResponse buildRatingSummary(String productId) {
        List<Object[]> breakdown = ratingRepository.getRatingBreakdown(productId);

        Map<Integer, Long> breakdownMap = new HashMap<>();
        for (int i = 1; i <= 5; i++) breakdownMap.put(i, 0L); // khởi tạo đủ 5 sao

        long total = 0;
        long sumStars = 0;

        for (Object[] row : breakdown) {
            int star = ((Number) row[0]).intValue();
            long count = ((Number) row[1]).longValue();
            breakdownMap.put(star, count);
            total += count;
            sumStars += (long) star * count;
        }

        double avg = total > 0
                ? Math.round((double) sumStars / total * 10.0) / 10.0
                : 0.0;

        return RatingSummaryResponse.builder()
                .averageRating(avg)
                .totalRatings(total)
                .ratingBreakdown(breakdownMap)
                .build();
    }
}
