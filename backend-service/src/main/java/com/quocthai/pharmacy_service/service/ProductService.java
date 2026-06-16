package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.dto.admin.request.*;
import com.quocthai.pharmacy_service.dto.admin.request.CreateProductRequest;
import com.quocthai.pharmacy_service.dto.response.*;
import com.quocthai.pharmacy_service.entity.*;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.dto.admin.response.ProductRespone;

import com.quocthai.pharmacy_service.mapper.ProductMapper;
import com.quocthai.pharmacy_service.repository.*;
import com.quocthai.pharmacy_service.search.document.ProductDocumentSearch;
import com.quocthai.pharmacy_service.search.document.ProductVariantDocument;
import com.quocthai.pharmacy_service.search.mapper.ProductSearchMapper;
import com.quocthai.pharmacy_service.search.repository.ProductSearchRepository;
import com.quocthai.pharmacy_service.search.service.ProductSearchService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
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

    ProductMapper toResponseAdmin;
    private final ProductMapper productMapper;
    private final ProductSearchRepository productSearchRepository;
    private final ProductSearchMapper productSearchMapper;
    ProductSearchService productSearchService;

    @Transactional(readOnly = true)
    public PageResponse<ProductSummaryResponse> getProductsByCategory(
            String categorySlug,
            int page,
            int size,
            String sortBy,
            String sortDir,
            String manufacturer,
            String country,
            BigDecimal minPrice,
            BigDecimal maxPrice
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
                            manufacturer,   // Tham số mới
                            country,        // Tham số mới
                            minPrice,       // Tham số mới
                            maxPrice,
                            pageable
                    );
        } else {
            // Category cấp 2
            productPage =
                    productRepository.findByCategoryId(
                            category.getId(),
                            manufacturer,   // Tham số mới
                            country,        // Tham số mới
                            minPrice,       // Tham số mới
                            maxPrice,
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
    // lấy sản phẩm mới cho homepage
    @Transactional(readOnly = true)
    public PageResponse<ProductSummaryResponse> getAllProducts(
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {
        // 1. Cấu hình sắp xếp + Phân trang
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        // 2. Query lấy toàn bộ sản phẩm (Sử dụng findAll mặc định của JPA)
        Page<Product> productPage = productRepository.findAll(pageable);

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

        // 3. Lấy danh sách Product IDs
        List<String> productIds = products.stream()
                .map(Product::getId)
                .toList();

        // 4. Lấy ảnh chính (Primary images)
        Map<String, String> imageMap =
                productImageRepository
                        .findAllByProductIdInAndIsPrimaryTrue(productIds)
                        .stream()
                        .collect(Collectors.toMap(
                                img -> img.getProduct().getId(),
                                ProductImage::getImageUrl,
                                (oldValue, newValue) -> oldValue
                        ));

        // 5. Lấy danh sách biến thể (Variants) và kiểm tra Tồn kho (Stock)
        List<ProductVariant> variants =
                productVariantRepository.findAllByProductIdIn(productIds);

        List<String> variantIds = variants.stream()
                .map(ProductVariant::getId)
                .toList();

        Map<String, Integer> stockMap =
                variantIds.isEmpty()
                        ? new HashMap<>()
                        : inventoryBatchRepository
                        .getStockMapByVariantIds(variantIds, LocalDate.now())
                        .stream()
                        .collect(Collectors.toMap(
                                row -> (String) row[0],
                                row -> ((Number) row[1]).intValue()
                        ));

        // Nhóm biến thể theo từng sản phẩm
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
                                                .stockQuantity(stockMap.getOrDefault(v.getId(), 0))
                                                .build(),
                                        Collectors.toList()
                                )
                        ));

        // 6. Map dữ liệu sang DTO Response
        List<ProductSummaryResponse> responses =
                products.stream()
                        .map(product -> {
                            Category prodCat = product.getCategory();
                            return ProductSummaryResponse.builder()
                                    .id(product.getId())
                                    .name(product.getName())
                                    .slug(product.getSlug())
                                    .isPrescription(product.isPrescription())
                                    .active(product.isActive())
                                    .manufacturer(product.getManufacturer())
                                    .country(product.getCountry())
                                    .primaryImageUrl(imageMap.getOrDefault(product.getId(), ""))
                                    .categoryId(prodCat != null ? prodCat.getId() : null)
                                    .categoryName(prodCat != null ? prodCat.getName() : null)
                                    .categorySlug(prodCat != null ? prodCat.getSlug() : null)
                                    .variants(variantMap.getOrDefault(product.getId(), Collections.emptyList()))
                                    .build();
                        })
                        .toList();

        // 7. Trả về kết quả phân trang
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

    // admin get product
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public PageResponse<ProductSummaryResponse> getAdminProducts(
            String keyword,
            String categoryId,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        List<String> categoryIds = null;
        if (categoryId != null && !categoryId.isBlank()) {
            Category category = categoryRepository.findById(categoryId).orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            categoryIds = new ArrayList<>();
            collectChildCategoryIds(category, categoryIds);
        }
        Page<Product> productPage =
                productRepository.searchAdminProducts(
                        keyword,
                        categoryIds,
                        pageable
                );

        List<ProductSummaryResponse> items =
                productPage.getContent()
                        .stream()
                        .map(this::toSummaryResponse)
                        .toList();

        return PageResponse.<ProductSummaryResponse>builder()
                .content(items)
                .page(page)
                .size(size)
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .last(productPage.isLast())
                .build();
    }

    /**
     * Recursive lấy toàn bộ category con/cháu
     */
    private void collectChildCategoryIds(Category category, List<String> ids) {
        ids.add(category.getId());
        if (category.getChildren() != null && !category.getChildren().isEmpty()) {
            for (Category child : category.getChildren()) {
                collectChildCategoryIds(child, ids);
            }
        }
    }

    private ProductSummaryResponse toSummaryResponse(Product product) {
        String primaryImage = product.getImages()
                .stream()
                .filter(ProductImage::isPrimary)
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse("");
        List<ProductVariantResponse> variants =
                product.getVariants()
                        .stream()
                        .filter(ProductVariant::isActive)
                        .map(v -> ProductVariantResponse.builder()
                                .id(v.getId())
                                .sku(v.getSku())
                                .variantName(v.getVariantName())
                                .price(v.getPrice())
                                .originalPrice(v.getOriginalPrice())
                                .variantDefault(v.isVariantDefault())
                                .stockQuantity(0) // admin list chưa cần tính kho
                                .build())
                        .toList();
        return ProductSummaryResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .manufacturer(product.getManufacturer())
                .country(product.getCountry())
                .isPrescription(product.isPrescription())
                .active(product.isActive())
                .primaryImageUrl(primaryImage)
                .categoryId(
                        product.getCategory() != null
                                ? product.getCategory().getId()
                                : null
                )
                .categoryName(
                        product.getCategory() != null
                                ? product.getCategory().getName()
                                : null
                )
                .categorySlug(
                        product.getCategory() != null
                                ? product.getCategory().getSlug()
                                : null
                )
                .variants(variants)
                .build();
    }

    // admin lấy chi tiết sản phẩm
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ProductDetailResponse getProductDetailAdmin(String slug) {
        log.info("slug: {}", slug);        // Query 1: Product + Category + ProductDetail
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
        // Gom dữ liệu danh sách VariantResponse trả về cho Frontend lựa chọn quy cách đóng gói
        List<ProductVariantResponse> variantResponses = activeVariants.stream()
                .map(v -> ProductVariantResponse.builder()
                        .id(v.getId())
                        .sku(v.getSku())
                        .variantName(v.getVariantName())
                        .price(v.getPrice())
                        .originalPrice(v.getOriginalPrice())
                        .variantDefault(v.isVariantDefault())
                        .build())
                .toList();
        // Map thông tin mô tả chi tiết thuốc
        return ProductDetailResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .isPrescription(product.isPrescription())
                .manufacturer(product.getManufacturer())
                .country(product.getCountry())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .categorySlug(product.getCategory() != null ? product.getCategory().getSlug() : null)
                .images(images)
                .variants(variantResponses)
                .specifications(specifications)
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ProductRespone createProduct(CreateProductRequest request) {
        if (request.getPrimaryImageUrl() == null || request.getPrimaryImageUrl().isBlank()) {
            throw new AppException(ErrorCode.PRIMARY_IMAGE_REQUIRED);
        }
        Category category = categoryRepository
                .findBySlug(request.getCategorySlug())
                .orElseThrow(() ->
                        new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        Product product = Product.builder()
                .active(true)
                .name(request.getName())
                .slug(generateSlug(request.getName()))
                .description(request.getDescription())
                .manufacturer(request.getManufacturer())
                .country(request.getCountry())
                .isPrescription(request.getPrescription())
                .category(category)
                .build();
        productRepository.save(product);

        // ── Ảnh ──
        List<ProductImage> images = new ArrayList<>();
        images.add(ProductImage.builder()
                .product(product)
                .imageUrl(request.getPrimaryImageUrl())
                .isPrimary(true)
                .build());

        if (request.getSubImageUrls() != null && !request.getSubImageUrls().isEmpty()) {
            request.getSubImageUrls().stream()
                    .filter(url -> url != null && !url.isBlank())
                    .map(url -> ProductImage.builder()
                            .product(product)
                            .imageUrl(url)
                            .isPrimary(false)
                            .build())
                    .forEach(images::add);
        }
        productImageRepository.saveAll(images);

        // ── Specifications ──
        List<ProductSpecification> specifications =
                request.getSpecifications()
                        .stream()
                        .map(item ->
                                ProductSpecification.builder()
                                        .product(product)
                                        .displayOrder(item.getDisplayOrder())
                                        .specKey(item.getSpecKey())
                                        .specValue(item.getSpecValue())
                                        .build()
                        )
                        .toList();
        productSpecificationRepository.saveAll(specifications);

        // ── Variants ──
        List<ProductVariant> variants =
                request.getVariants()
                        .stream()
                        .map(item ->
                                ProductVariant.builder()
                                        .product(product)
                                        .active(true)
                                        .variantName(item.getVariantName())
                                        .price(item.getPrice())
                                        .originalPrice(item.getOriginalPrice())
                                        .variantDefault(item.isVariantDefault())
                                        .sku(item.getSku())
                                        .build()
                        )
                        .toList();

        productVariantRepository.saveAll(variants);
        product.setImages(images);
        product.setSpecifications(specifications);
        product.setVariants(variants);
        product.setPriceDefault();

        // sync Elasticsearch
        ProductDocumentSearch document = toDocument(product);
        productSearchRepository.save(document);

        return productMapper.toResponseAdmin(product);
    }
    /**
     * Update sản phẩm hoàn chỉnh:
     *  1. Cập nhật thông tin cơ bản
     *  2. Xử lý ảnh: xóa ảnh cũ, cập nhật ảnh chính mới (nếu có URL mới), thêm ảnh phụ mới
     *  3. Upsert specifications (xóa toàn bộ cũ, insert mới)
     *  4. Upsert variants (update/insert mới, soft-delete bị xóa)
     *  5. Tính lại priceDefault
     *  6. Sync Elasticsearch
     *
     * Ảnh đã được upload lên Cloudinary từ FE trước khi gọi — chỉ nhận URL.
     * Không có N+1: mỗi collection load 1 query riêng biệt, stock dùng batch map.
     */
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public String updateProduct(String id, UpdateProductRequest request) {

        // ── 1. Load product theo 3 query riêng — tránh MultiBagFetchException ──
        // Query 1: product + category + images
        Product product = productRepository.findDetailById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        // Query 2: variants (fetch riêng để tránh Cartesian Product)
        productRepository.findWithVariantsById(id)
                .ifPresent(p -> product.setVariants(p.getVariants()));

        // ── 2. Category ──
        Category category = categoryRepository
                .findBySlug(request.getCategorySlug())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // ── 3. Cập nhật thông tin cơ bản ──
        product.setName(request.getName());
        product.setSlug(generateSlug(request.getName()));
        product.setManufacturer(request.getManufacturer());
        product.setDescription(request.getDescription());
        product.setCountry(request.getCountry());
        product.setPrescription(request.isPrescription());
        product.setCategory(category);

        // ── 4. Xử lý ảnh ──

        // 4a. Xóa ảnh phụ bị đánh dấu xóa từ FE (chỉ ID thực, bỏ local-xxx)
        if (request.getDeletedImageIds() != null && !request.getDeletedImageIds().isEmpty()) {
            List<String> realDeletedIds = request.getDeletedImageIds().stream()
                    .filter(imgId -> imgId != null && !imgId.startsWith("local-"))
                    .toList();
            if (!realDeletedIds.isEmpty()) {
                // Dùng JPQL DELETE — 1 query duy nhất, không có N+1
                productImageRepository.deleteAllByIds(realDeletedIds);
            }
        }

        // 4b. Thay ảnh chính nếu FE gửi URL mới
        if (request.getPrimaryImageUrl() != null && !request.getPrimaryImageUrl().isBlank()) {
            // Xóa ảnh chính cũ bằng 1 JPQL DELETE
            productImageRepository.deletePrimaryByProductId(product.getId());
            // Insert ảnh chính mới
            ProductImage newPrimary = ProductImage.builder()
                    .product(product)
                    .imageUrl(request.getPrimaryImageUrl())
                    .isPrimary(true)
                    .build();
            productImageRepository.save(newPrimary);
        }

        // 4c. Thêm các ảnh phụ mới (đã có URL Cloudinary)
        if (request.getNewSubImageUrls() != null && !request.getNewSubImageUrls().isEmpty()) {
            List<ProductImage> newSubImages = request.getNewSubImageUrls().stream()
                    .filter(url -> url != null && !url.isBlank())
                    .map(url -> ProductImage.builder()
                            .product(product)
                            .imageUrl(url)
                            .isPrimary(false)
                            .build())
                    .toList();
            if (!newSubImages.isEmpty()) {
                productImageRepository.saveAll(newSubImages);
            }
        }

        // ── 5. Upsert Specifications ──
        // Dùng JPQL DELETE (1 query) thay vì loop delete để tránh N+1
        if (request.getSpecifications() != null) {
            productSpecificationRepository.deleteAllByProductId(product.getId());
            // flush để Hibernate đẩy DELETE xuống DB trước khi INSERT specs mới
            // tránh constraint violation nếu có unique index trên (product_id, displayOrder)
            productSpecificationRepository.flush();

            List<ProductSpecification> newSpecs = request.getSpecifications().stream()
                    .map(specReq -> ProductSpecification.builder()
                            .product(product)
                            .specKey(specReq.getSpecKey())
                            .specValue(specReq.getSpecValue())
                            .displayOrder(specReq.getDisplayOrder())
                            .build())
                    .toList();
            productSpecificationRepository.saveAll(newSpecs);
        }

        // ── 6. Upsert Variants ──
        if (request.getVariants() != null) {
            // Build lookup map O(1) từ danh sách variants đã load ở bước 1 — tránh N+1
            Map<String, ProductVariant> existingVariantMap = product.getVariants().stream()
                    .collect(Collectors.toMap(ProductVariant::getId, v -> v));

            List<ProductVariant> upsertedVariants = request.getVariants().stream()
                    .map(varReq -> {
                        String reqId = varReq.getId();
                        if (reqId != null && !reqId.isBlank() && existingVariantMap.containsKey(reqId)) {
                            // Update variant đã có
                            ProductVariant existing = existingVariantMap.get(reqId);
                            existing.setVariantName(varReq.getVariantName());
                            existing.setPrice(varReq.getPrice());
                            existing.setOriginalPrice(varReq.getOriginalPrice());
                            existing.setSku(varReq.getSku());
                            existing.setVariantDefault(varReq.isVariantDefault());
                            return existing;
                        } else {
                            // Tạo variant mới
                            return ProductVariant.builder()
                                    .product(product)
                                    .active(true)
                                    .variantName(varReq.getVariantName())
                                    .price(varReq.getPrice())
                                    .originalPrice(varReq.getOriginalPrice())
                                    .sku(varReq.getSku())
                                    .variantDefault(varReq.isVariantDefault())
                                    .build();
                        }
                    })
                    .toList();
            productVariantRepository.saveAll(upsertedVariants);
        }

        // 6b. Soft-delete variants bị xóa từ FE
        if (request.getDeletedVariantIds() != null && !request.getDeletedVariantIds().isEmpty()) {
            List<ProductVariant> toDeactivate = productVariantRepository
                    .findAllById(request.getDeletedVariantIds());
            toDeactivate.forEach(v -> v.setActive(false));
            productVariantRepository.saveAll(toDeactivate);
        }

        // ── 7. Tính lại priceDefault ──
        // Reload variants từ DB để phản ánh đúng trạng thái sau upsert + soft-delete
        // findAllByProductIdIn = 1 query IN cho tất cả variants của product — không N+1
        List<ProductVariant> currentVariants =
                productVariantRepository.findAllByProductIdIn(List.of(product.getId()));

        List<ProductVariant> activeVariants = currentVariants.stream()
                .filter(ProductVariant::isActive)
                .toList();

        BigDecimal priceDefault = activeVariants.stream()
                .filter(ProductVariant::isVariantDefault)
                .map(ProductVariant::getPrice)
                .findFirst()
                .orElse(activeVariants.isEmpty()
                        ? BigDecimal.ZERO
                        : activeVariants.get(0).getPrice());

        product.setPriceDefault(priceDefault);

        productRepository.save(product);

        // ── 8. Sync Elasticsearch ──
        // Build document từ dữ liệu đã có trong RAM, không reload lại DB
        // Stock: dùng batch map 1 query để tránh N+1 trong toDocument
        try {
            // Lấy stockMap 1 lần cho tất cả active variants
            List<String> variantIds = activeVariants.stream()
                    .map(ProductVariant::getId)
                    .toList();

            Map<String, Integer> stockMap = variantIds.isEmpty()
                    ? new HashMap<>()
                    : inventoryBatchRepository.getStockMapByVariantIds(variantIds, LocalDate.now())
                    .stream()
                    .collect(Collectors.toMap(
                            row -> (String) row[0],
                            row -> ((Number) row[1]).intValue()
                    ));

            // Load ảnh mới nhất từ DB để đồng bộ chính xác lên ES (1 query)
            List<ProductImage> freshImages = productImageRepository.findAllByProductId(product.getId());
            product.setImages(freshImages);

            ProductDocumentSearch document = toDocumentWithStockMap(product, stockMap);
            productSearchRepository.save(document);
            log.info("Elasticsearch synced for product id={}", product.getId());
        } catch (Exception e) {
            // Không để lỗi ES rollback DB transaction
            log.error("Failed to sync Elasticsearch for product id={}: {}", product.getId(), e.getMessage());
        }

        return "Cập nhật sản phẩm thành công";
    }

    /**
     * Build Elasticsearch document dùng stockMap đã tính sẵn — tránh N+1 trong loop variants.
     */
    private ProductDocumentSearch toDocumentWithStockMap(Product product, Map<String, Integer> stockMap) {
        ProductDocumentSearch document = new ProductDocumentSearch();
        document.setId(product.getId());
        document.setName(product.getName());
        document.setDescription(product.getDescription());
        document.setSlug(product.getSlug());
        document.setManufacturer(product.getManufacturer());
        document.setCountry(product.getCountry());
        document.setPriceDefault(product.getPriceDefault());
        document.setPrescription(product.isPrescription());

        if (product.getCategory() != null) {
            document.setCategoryId(product.getCategory().getId());
            document.setCategoryName(product.getCategory().getName());
            document.setCategorySlug(product.getCategory().getSlug());
        }

        String primaryImageUrl = product.getImages().stream()
                .filter(ProductImage::isPrimary)
                .findFirst()
                .map(ProductImage::getImageUrl)
                .orElse(null);
        document.setPrimaryImageUrl(primaryImageUrl);

        List<ProductVariantDocument> variants = product.getVariants().stream()
                .map(v -> {
                    ProductVariantDocument doc = new ProductVariantDocument();
                    doc.setId(v.getId());
                    doc.setSku(v.getSku());
                    doc.setVariantName(v.getVariantName());
                    doc.setPrice(v.getPrice());
                    doc.setOriginalPrice(v.getOriginalPrice());
                    doc.setVariantDefault(v.isVariantDefault());
                    doc.setStockQuantity(stockMap.getOrDefault(v.getId(), 0));
                    return doc;
                })
                .toList();
        document.setVariants(variants);
        return document;
    }

    // mapper qua elasticsearch
    public ProductDocumentSearch toDocument(Product product ) {

        ProductDocumentSearch document =
                new ProductDocumentSearch();

        document.setId(product.getId());
        document.setName(product.getName());
        document.setDescription(product.getDescription());
        document.setSlug(product.getSlug());
        document.setManufacturer(product.getManufacturer());
        document.setCountry(product.getCountry());
        document.setPriceDefault(product.getPriceDefault());

        document.setPrescription(
                product.isPrescription()
        );

        if (product.getCategory() != null) {

            document.setCategoryId(
                    product.getCategory().getId()
            );

            document.setCategoryName(
                    product.getCategory().getName()
            );

            document.setCategorySlug(
                    product.getCategory().getSlug()
            );
        }

        // Primary image
        String primaryImageUrl =
                product.getImages()
                        .stream()
                        .filter(ProductImage::isPrimary)
                        .findFirst()
                        .map(ProductImage::getImageUrl)
                        .orElse(null);

        document.setPrimaryImageUrl(
                primaryImageUrl
        );

        // Variants
        List<ProductVariantDocument> variants =
                product.getVariants()
                        .stream()
                        .map(this::toVariantDocument)
                        .toList();

        document.setVariants(variants);

        return document;
    }

    private ProductVariantDocument toVariantDocument(
            ProductVariant variant
    ) {
        if (variant == null) {
            return null;
        }

        ProductVariantDocument doc =
                new ProductVariantDocument();
        doc.setId(variant.getId());
        doc.setSku(variant.getSku());
        doc.setVariantName(
                variant.getVariantName()
        );
        doc.setPrice(variant.getPrice());
        doc.setOriginalPrice(
                variant.getOriginalPrice()
        );
        doc.setVariantDefault(
                variant.isVariantDefault()
        );
        int totalStock = inventoryBatchRepository.getTotalStockByVariantId(variant.getId(), LocalDate.now());
        doc.setStockQuantity(totalStock);

        return doc;
    }

    private String generateSlug(String input) {

        if (input == null || input.isBlank()) {
            return "";
        }

        // bỏ dấu tiếng Việt
        String slug = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        // đ -> d
        slug = slug.replace("đ", "d")
                .replace("Đ", "D");

        // lowercase
        slug = slug.toLowerCase();

        // thay ký tự đặc biệt thành -
        slug = slug.replaceAll("[^a-z0-9\\s-]", "");

        // khoảng trắng -> -
        slug = slug.replaceAll("\\s+", "-");

        // nhiều dấu - liên tiếp -> 1 dấu -
        slug = slug.replaceAll("-+", "-");

        // xóa - đầu cuối
        slug = slug.replaceAll("^-|-$", "");

        return slug;
    }
    @Transactional
    public String updateActiveStatus(String id, boolean status) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        product.setActive(status);
        productRepository.save(product);

        // 3. (Quan trọng) Đồng bộ lại trạng thái mới lên Elasticsearch để trang chủ/tìm kiếm cập nhật theo
        productSearchService.updateStatus(id,status);

        // 4. Map và trả về DTO kết quả
        return "Cập nhật trạng thái sản phẩm thành công";
    }


}