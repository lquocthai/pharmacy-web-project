package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.entity.Product;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.repository.ProductRepository;
import com.quocthai.pharmacy_service.search.repository.ProductSearchRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SymptomService {

    ProductRepository productRepository;
    ProductSearchRepository productSearchRepository;
    @Transactional(readOnly = true)
    public List<String> getSymptoms(String productId) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        return product.getSymptoms()
                .stream()
                .sorted()
                .toList();
    }
    /**
     * Thêm triệu chứng vào sản phẩm.
     * - Trim khoảng trắng, bỏ rỗng, loại trùng lặp qua Set.
     * - Sau khi lưu JPA, đồng bộ sang Elasticsearch ngay lập tức.
     */
    @Transactional
    public void addSymptoms(String productId, List<String> names) {
        Product product = productRepository.findByIdWithSymptoms(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        Set<String> newSymptoms = sanitize(names);
        product.getSymptoms().addAll(newSymptoms);

        productRepository.save(product);
        log.info("Đã thêm {} triệu chứng vào sản phẩm {}", newSymptoms.size(), productId);

        syncToElasticsearch(product);
    }

    /**
     * Cập nhật (thay thế toàn bộ) triệu chứng của sản phẩm.
     * - Xóa hết triệu chứng cũ, set lại danh sách mới.
     * - Sau khi lưu JPA, đồng bộ sang Elasticsearch ngay lập tức.
     */
    @Transactional
    public void editSymptoms(String productId, List<String> names) {
        Product product = productRepository.findByIdWithSymptoms(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        Set<String> updatedSymptoms = sanitize(names);

        product.getSymptoms().clear();
        product.getSymptoms().addAll(updatedSymptoms);

        productRepository.save(product);
        log.info("Đã cập nhật triệu chứng sản phẩm {} — tổng {} triệu chứng", productId, updatedSymptoms.size());

        syncToElasticsearch(product);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Trim, lọc rỗng, loại trùng lặp.
     */
    private Set<String> sanitize(List<String> names) {
        if (names == null || names.isEmpty()) {
            return Set.of();
        }
        return names.stream()
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toSet());
    }

    /**
     * Đồng bộ symptoms của Product vào document Elasticsearch tương ứng.
     * Chỉ cập nhật field symptomKeywords, không overwrite toàn bộ document.
     */
    private void syncToElasticsearch(Product product) {
        productSearchRepository.findById(product.getId()).ifPresentOrElse(
                doc -> {
                    doc.setSymptomKeywords(List.copyOf(product.getSymptoms()));
                    productSearchRepository.save(doc);
                    log.info("Đã sync symptoms sang Elasticsearch cho sản phẩm {}", product.getId());
                },
                () -> log.warn("Không tìm thấy document Elasticsearch cho sản phẩm {} — bỏ qua sync", product.getId())
        );
    }
}
