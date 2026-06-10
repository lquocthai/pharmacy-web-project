package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.entity.Product;
import com.quocthai.pharmacy_service.entity.ProductImage;
import com.quocthai.pharmacy_service.entity.ProductVariant;
import com.quocthai.pharmacy_service.repository.InventoryBatchRepository;
import com.quocthai.pharmacy_service.repository.ProductImageRepository;
import com.quocthai.pharmacy_service.repository.ProductRepository;
import com.quocthai.pharmacy_service.repository.ProductVariantRepository;
import com.quocthai.pharmacy_service.search.document.ProductDocumentSearch;
import com.quocthai.pharmacy_service.search.document.ProductVariantDocument;
import com.quocthai.pharmacy_service.search.repository.ProductSearchRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ElasticsearchHealthService {

    private final ElasticsearchOperations operations;
    private final ProductSearchRepository productSearchRepository;
    private final ProductRepository productRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductVariantRepository productVariantRepository;

    @PostConstruct
    public void check() {
        try {
            boolean exists = operations
                    .indexOps(ProductDocumentSearch.class)
                    .exists();

            System.out.println("✅ Elasticsearch connected!");
            System.out.println("Index exists: " + exists);

        } catch (Exception e) {
            System.out.println("❌ Elasticsearch connection failed!");
            e.printStackTrace();
        }
    }
//    @PostConstruct
    public void test() {

    }
//    @PostConstruct
    public void clearAllDocuments() {
        try {
            System.out.println("⏳ Deleting all documents from index...");
            productSearchRepository.deleteAll(); // Xóa sạch toàn bộ bản ghi
            System.out.println("✨ All documents cleared completely!");
        } catch (Exception e) {
            System.err.println("❌ Failed to clear documents!");
            e.printStackTrace();
        }
    }
    // sync data product vào elasticsearch
    @Transactional(readOnly = true)
    @PostConstruct
    public void syncAllProductsToElasticsearch() {

        List<Product> products = productRepository.findAllBasic();

        List<String> productIds = products.stream()
                .map(Product::getId)
                .toList();

        List<ProductImage> images = productImageRepository.findAllByProductIdIn(productIds);
        List<ProductVariant> variants = productVariantRepository.findAllByProductIdIn(productIds);

        List<String> variantIds = variants.stream()
                .map(ProductVariant::getId)
                .toList();

        Map<String, Integer> stockMap = getStockMap(variantIds);

        Map<String, List<ProductImage>> imageMap =
                images.stream().collect(Collectors.groupingBy(i -> i.getProduct().getId()));

        Map<String, List<ProductVariant>> variantMap =
                variants.stream().collect(Collectors.groupingBy(v -> v.getProduct().getId()));

        List<ProductDocumentSearch> documents = products.stream()
                .map(p -> mapToDocument(p, imageMap, variantMap, stockMap))
                .toList();

        productSearchRepository.saveAll(documents);

        log.info("Synced {} products", documents.size());
    }
    private ProductDocumentSearch mapToDocument(
            Product product,
            Map<String, List<ProductImage>> imageMap,
            Map<String, List<ProductVariant>> variantMap,
            Map<String, Integer> stockMap) {

        // 1. Lấy danh sách ảnh của sản phẩm này từ map bộ nhớ tạm
        List<ProductImage> productImages = imageMap.getOrDefault(product.getId(), List.of());

        // Tìm ảnh chính (isPrimary = true), nếu không có thì lấy đại ảnh đầu tiên, nếu không có ảnh nào thì để null
        String primaryImageUrl = productImages.stream()
                .filter(ProductImage::isPrimary)
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse(productImages.isEmpty() ? null : productImages.get(0).getImageUrl());

        // 2. Lấy danh sách biến thể của sản phẩm này và chuyển đổi sang định dạng Document Nested
        List<ProductVariant> productVariants = variantMap.getOrDefault(product.getId(), List.of());
        BigDecimal calculatedPriceDefault = productVariants.stream()
                .filter(ProductVariant::isVariantDefault)
                .map(ProductVariant::getPrice)
                .findFirst()
                .orElse(!productVariants.isEmpty() ? productVariants.get(0).getPrice() : BigDecimal.ZERO);

        List<ProductVariantDocument> variantDocuments = productVariants.stream()
                .map(variant -> {
                    // Lấy số lượng tồn kho từ stockMap bằng variantId, mặc định là 0 nếu không tìm thấy
                    Integer stockQuantity = stockMap.getOrDefault(variant.getId(), 0);

                    return ProductVariantDocument.builder()
                            .id(variant.getId())
                            .sku(variant.getSku())
                            .variantName(variant.getVariantName())
                            .price(variant.getPrice())
                            .originalPrice(variant.getOriginalPrice())
                            .variantDefault(variant.isVariantDefault())
                            .stockQuantity(stockQuantity)
                            .build();
                })
                .toList();

        // 3. Trích xuất thông tin Category một cách an toàn (tránh NullPointerException)
        String categoryId = product.getCategory() != null ? product.getCategory().getId() : null;
        String categoryName = product.getCategory() != null ? product.getCategory().getName() : null;
        String categorySlug = product.getCategory() != null ? product.getCategory().getSlug() : null;

        // 4. Build đối tượng ProductDocumentSearch hoàn chỉnh để đẩy lên Elasticsearch
        return ProductDocumentSearch.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .slug(product.getSlug())
                .manufacturer(product.getManufacturer())
                .country(product.getCountry())
                .priceDefault(calculatedPriceDefault)
                .prescription(product.isPrescription()) // Map vào trường Boolean prescription
                .primaryImageUrl(primaryImageUrl)
                .categoryId(categoryId)
                .categoryName(categoryName)
                .categorySlug(categorySlug)
                .variants(variantDocuments) // Mảng nested object của Elasticsearch
                .symptomKeywords(
                        product.getSymptoms()
                                .stream()
                                .toList()
                )
                .build();
    }
    private Map<String, Integer> getStockMap(List<String> variantIds) {

        if (variantIds.isEmpty()) {
            return new HashMap<>();
        }

        List<Object[]> rows =
                inventoryBatchRepository.getStockMapByVariantIds(variantIds, LocalDate.now());

        return rows.stream()
                .collect(Collectors.toMap(
                        r -> (String) r[0],        // variantId
                        r -> ((Number) r[1]).intValue()
                ));
    }
}
