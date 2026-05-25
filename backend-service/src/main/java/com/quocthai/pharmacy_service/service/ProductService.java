package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.dto.response.*;
import com.quocthai.pharmacy_service.entity.Category;
import com.quocthai.pharmacy_service.entity.Product;
import com.quocthai.pharmacy_service.entity.ProductImage;
import com.quocthai.pharmacy_service.entity.ProductVariant;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.*;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProductService {

    ProductRepository productRepository;
    InventoryBatchRepository inventoryBatchRepository;
    ProductImageRepository productImageRepository;
    RatingRepository ratingRepository;
    ProductSpecificationRepository productSpecificationRepository;
    CategoryRepository categoryRepository;
    ProductVariantRepository productVariantRepository;

    @Transactional(readOnly = true)
    public PageResponse<ProductSummaryResponse> getProductsByCategory(
            String categorySlug,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {

        // 1. Find category
        Category category = categoryRepository.findBySlug(categorySlug)
                .orElseThrow(() ->
                        new AppException(ErrorCode.CATEGORY_NOT_EXISTED)
                );

        // 2. Sort + pagination
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        // 3. Query products
        Page<Product> productPage;

        // Category cấp 1
        if (category.getParent() == null) {

            productPage =
                    productRepository.findByCategoryIdOrCategoryParentId(
                            category.getId(),
                            category.getId(),
                            pageable
                    );

        } else {

            // Category cấp 2
            productPage =
                    productRepository.findByCategoryId(
                            category.getId(),
                            pageable
                    );
        }

        List<Product> products = productPage.getContent();

        if (products.isEmpty()) {

            return PageResponse.<ProductSummaryResponse>builder()
                    .content(Collections.emptyList())
                    .page(page)
                    .size(size)
                    .totalElements(0)
                    .totalPages(0)
                    .last(true)
                    .build();
        }

        // 4. Product IDs
        List<String> productIds = products.stream()
                .map(Product::getId)
                .toList();

        // 5. Primary images
        Map<String, String> imageMap =
                productImageRepository
                        .findAllByProductIdInAndIsPrimaryTrue(productIds)
                        .stream()
                        .collect(Collectors.toMap(
                                img -> img.getProduct().getId(),
                                ProductImage::getImageUrl,
                                (oldValue, newValue) -> oldValue
                        ));

        // 6. Reuse đúng logic variants giống getProductDetail
        List<ProductVariant> variants =
                productVariantRepository.findAllByProductIdIn(productIds);

        List<String> variantIds = variants.stream()
                .map(ProductVariant::getId)
                .toList();

        Map<String, Integer> stockMap =
                variantIds.isEmpty()
                        ? new HashMap<>()
                        : inventoryBatchRepository
                        .getStockMapByVariantIds(
                                variantIds,
                                LocalDate.now()
                        )
                        .stream()
                        .collect(Collectors.toMap(
                                row -> (String) row[0],
                                row -> ((Number) row[1]).intValue()
                        ));

        Map<String, List<ProductVariantResponse>> variantMap =
                variants.stream()
                        .filter(ProductVariant::isActive)
                        .collect(Collectors.groupingBy(
                                v -> v.getProduct().getId(),
                                Collectors.mapping(
                                        v -> ProductVariantResponse.builder()
                                                .id(v.getId())
                                                .sku(v.getSku())
                                                .variantName(v.getVariantName())
                                                .price(v.getPrice())
                                                .originalPrice(v.getOriginalPrice())
                                                .variantDefault(v.isVariantDefault())
                                                .stockQuantity(
                                                        stockMap.getOrDefault(
                                                                v.getId(),
                                                                0
                                                        )
                                                )
                                                .build(),
                                        Collectors.toList()
                                )
                        ));

        // 7. Build response
        List<ProductSummaryResponse> responses =
                products.stream()
                        .map(product -> {

                            Category prodCat = product.getCategory();

                            return ProductSummaryResponse.builder()
                                    .id(product.getId())
                                    .name(product.getName())
                                    .slug(product.getSlug())
                                    .isPrescription(product.isPrescription())
                                    .manufacturer(product.getManufacturer())
                                    .country(product.getCountry())

                                    .primaryImageUrl(
                                            imageMap.getOrDefault(
                                                    product.getId(),
                                                    ""
                                            )
                                    )

                                    .categoryId(prodCat.getId())
                                    .categoryName(prodCat.getName())
                                    .categorySlug(prodCat.getSlug())

                                    .variants(
                                            variantMap.getOrDefault(
                                                    product.getId(),
                                                    Collections.emptyList()
                                            )
                                    )

                                    .build();
                        })
                        .toList();

        // 8. Return
        return PageResponse.<ProductSummaryResponse>builder()
                .content(responses)
                .page(productPage.getNumber())
                .size(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .last(productPage.isLast())
                .build();
    }

//    // ================= GET PRODUCT DETAIL (SLUG) =================
    @Transactional(readOnly = true)
    public ProductDetailResponse getProductDetail(String slug) {
        // Query 1: Product + Category + ProductDetail
        Product product = productRepository.findBySlugWithDetail(slug)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_SLUG_NOT_EXISTED));

        // Query 2: Tất cả ảnh dùng chung của sản phẩm
        List<ProductImageResponse> images = productImageRepository
                .findAllByProductId(product.getId())
                .stream()
                .map(img -> ProductImageResponse.builder()
                        .id(img.getId())
                        .imageUrl(img.getImageUrl())
                        .defaultImage(img.isPrimary()) // Đồng bộ map trường mapping của bạn
                        .build())
                .toList();

        // Query 2: Lấy danh sách thông số động (Specifications) đã được sắp xếp
        List<ProductSpecificationResponse> specifications = productSpecificationRepository
                .findAllByProductIdOrderByDisplayOrder(product.getId())
                .stream()
                .map(spec -> ProductSpecificationResponse.builder()
                        .specKey(spec.getSpecKey())
                        .specValue(spec.getSpecValue())
                        .build())
                .toList();

        // Xử lý lấy danh sách Variant của Product
        List<ProductVariant> activeVariants = product.getVariants().stream()
                .filter(ProductVariant::isActive)
                .toList();

        List<String> variantIds = activeVariants.stream().map(ProductVariant::getId).toList();

        // Query 4: Quét kho hàng loạt theo Map (0 dính N+1) dựa trên các lô chưa hết hạn sử dụng năm 2026
        Map<String, Integer> stockMap = variantIds.isEmpty() ? new HashMap<>() :
                inventoryBatchRepository.getStockMapByVariantIds(variantIds, LocalDate.now())
                        .stream()
                        .collect(Collectors.toMap(
                                row -> (String) row[0],
                                row -> ((Number) row[1]).intValue()
                        ));

        // Gom dữ liệu danh sách VariantResponse trả về cho Frontend lựa chọn quy cách đóng gói
        List<ProductVariantResponse> variantResponses = activeVariants.stream()
                .map(v -> ProductVariantResponse.builder()
                        .id(v.getId())
                        .sku(v.getSku())
                        .variantName(v.getVariantName())
                        .price(v.getPrice())
                        .originalPrice(v.getOriginalPrice())
                        .variantDefault(v.isVariantDefault())
                        .stockQuantity(stockMap.getOrDefault(v.getId(), 0))
                        .build())
                .toList();

        int totalStockQuantity = variantResponses.stream().mapToInt(ProductVariantResponse::getStockQuantity).sum();

        // Query 4: Tính toán điểm rating
        RatingSummaryResponse ratingSummary = buildRatingSummary(product.getId());

        // Map thông tin mô tả chi tiết thuốc
        return ProductDetailResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .isPrescription(product.isPrescription())
                .manufacturer(product.getManufacturer())
                .country(product.getCountry())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .categorySlug(product.getCategory() != null ? product.getCategory().getSlug() : null)
                .images(images)
                .variants(variantResponses)
                .specifications(specifications)
                .totalStockQuantity(totalStockQuantity)
                .ratingSummary(ratingSummary)
                .build();
    }


    // ── Helper: tính rating summary ───────────────────
    private RatingSummaryResponse buildRatingSummary(String productId) {
        List<Object[]> breakdown = ratingRepository.getRatingBreakdown(productId);

        Map<Integer, Long> breakdownMap = new HashMap<>();
        for (int i = 1; i <= 5; i++) breakdownMap.put(i, 0L);

        long total = 0;
        long sumStars = 0;

        for (Object[] row : breakdown) {
            int star = ((Number) row[0]).intValue();
            long count = ((Number) row[1]).longValue();
            breakdownMap.put(star, count);
            total += count;
            sumStars += star * count;
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