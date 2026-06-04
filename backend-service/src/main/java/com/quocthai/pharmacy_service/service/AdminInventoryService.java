package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.constants.InventoryTransactionType;
import com.quocthai.pharmacy_service.dto.admin.request.ImportInventoryRequest;
import com.quocthai.pharmacy_service.dto.admin.request.UpdateBatchRequest;
import com.quocthai.pharmacy_service.dto.admin.response.*;
import com.quocthai.pharmacy_service.dto.response.PageResponse;
import com.quocthai.pharmacy_service.entity.InventoryBatch;
import com.quocthai.pharmacy_service.entity.InventoryTransaction;
import com.quocthai.pharmacy_service.entity.ProductVariant;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.repository.InventoryBatchRepository;
import com.quocthai.pharmacy_service.repository.InventoryTransactionRepository;
import com.quocthai.pharmacy_service.repository.ProductVariantRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminInventoryService {

    InventoryBatchRepository batchRepository;
    InventoryTransactionRepository transactionRepository;
    ProductVariantRepository variantRepository;

    private static final int DEFAULT_EXPIRING_DAYS = 90;

    // ─────────────────────────────────────────────────────────────────────────
    // API 1 — DASHBOARD
    // ─────────────────────────────────────────────────────────────────────────
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public InventoryDashboardResponse getDashboard() {
        LocalDate today = LocalDate.now();
        LocalDate expiryThreshold = today.plusDays(DEFAULT_EXPIRING_DAYS);

        long totalVariants = variantRepository.count();
        long totalBatches  = batchRepository.count();
        long totalStock    = batchRepository.sumTotalAvailableStock(today);
        long lowStock      = batchRepository.countLowStockBatches();
        long expiring      = batchRepository.countExpiringBatches(today, expiryThreshold);

        // out-of-stock: total variants - variants có hàng
        long variantsWithStock = batchRepository.findVariantIdsWithStock(today).size();
        long outOfStock = totalVariants - variantsWithStock;

        return InventoryDashboardResponse.builder()
                .totalVariants(totalVariants)
                .totalBatches(totalBatches)
                .totalStock(totalStock)
                .lowStockBatches(lowStock)
                .expiringBatches(expiring)
                .outOfStockVariants(outOfStock < 0 ? 0 : outOfStock)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // API 2 — DANH SÁCH LÔ HÀNG (search + filter + pageable)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<InventoryBatchResponse> getBatches(
            String keyword,
            String variantId,
            String batchNumber,
            LocalDate expiryFrom,
            LocalDate expiryTo,
            int page,
            int size,
            String sortBy,
            String sortDir) {

        Sort sort = buildSort(sortBy, sortDir);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<InventoryBatch> result = batchRepository.searchBatches(
                blankToNull(keyword),
                blankToNull(variantId),
                blankToNull(batchNumber),
                expiryFrom,
                expiryTo,
                pageable);

        return toPageResponse(result, this::toBatchResponse);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // API 3 — CHI TIẾT LÔ HÀNG
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public InventoryBatchResponse getBatchById(String id) {
        InventoryBatch batch = batchRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BATCH_NOT_FOUND));
        return toBatchResponse(batch);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // API 4 — NHẬP KHO
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Nếu batchNumber chưa tồn tại với variant → tạo mới.
     * Nếu đã tồn tại → cộng dồn remainingQuantity.
     * Luôn tạo InventoryTransaction type = IMPORT.
     */
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public InventoryBatchResponse importStock(ImportInventoryRequest req) {
        ProductVariant variant = variantRepository.findById(req.getVariantId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

        // Tìm batch hiện tại hoặc tạo mới
        InventoryBatch batch = batchRepository
                .findByVariantIdAndBatchNumber(req.getVariantId(), req.getBatchNumber())
                .map(existing -> {
                    // Cộng dồn
                    existing.setRemainingQuantity(existing.getRemainingQuantity() + req.getQuantity());
                    // Cập nhật giá nhập mới nhất nếu có
                    existing.setImportPrice(req.getImportPrice());
                    if (req.getLowStockThreshold() != null) {
                        existing.setLowStockThreshold(req.getLowStockThreshold());
                    }
                    return existing;
                })
                .orElseGet(() -> InventoryBatch.builder()
                        .variant(variant)
                        .batchNumber(req.getBatchNumber())
                        .manufactureDate(req.getManufactureDate())
                        .expiryDate(req.getExpiryDate())
                        .importPrice(req.getImportPrice())
                        .remainingQuantity(req.getQuantity())
                        .lowStockThreshold(req.getLowStockThreshold())
                        .build());

        InventoryBatch saved = batchRepository.save(batch);

        // Audit log
        InventoryTransaction tx = InventoryTransaction.builder()
                .batch(saved)
                .variant(variant)
                .type(InventoryTransactionType.IMPORT)
                .quantity(req.getQuantity())
                .referenceId("IMPORT")
                .build();
        transactionRepository.save(tx);

        log.info("Imported {} units into batch={} variant={}",
                req.getQuantity(), req.getBatchNumber(), req.getVariantId());

        return toBatchResponse(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // API 5 — CHỈNH SỬA LÔ HÀNG
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Chỉ cho sửa expiryDate, manufactureDate, lowStockThreshold.
     * Không cho sửa variant, batchNumber.
     */
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public InventoryBatchResponse updateBatch(String id, UpdateBatchRequest req) {
        InventoryBatch batch = batchRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BATCH_NOT_FOUND));

        batch.setExpiryDate(req.getExpiryDate());
        if (req.getManufactureDate() != null) {
            batch.setManufactureDate(req.getManufactureDate());
        }
        if (req.getLowStockThreshold() != null) {
            batch.setLowStockThreshold(req.getLowStockThreshold());
        }

        return toBatchResponse(batchRepository.save(batch));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // API 6 — LỊCH SỬ GIAO DỊCH KHO
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<InventoryTransactionResponse> getTransactions(
            InventoryTransactionType type,
            String variantId,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<InventoryTransaction> result = transactionRepository.searchTransactions(
                type,
                blankToNull(variantId),
                fromDate,
                toDate,
                pageable);

        return toPageResponse(result, this::toTransactionResponse);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // API 7 — TỒN THẤP
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<InventoryBatchResponse> getLowStockBatches(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "remainingQuantity"));
        Page<InventoryBatch> result = batchRepository.findLowStockBatches(pageable);
        return toPageResponse(result, this::toBatchResponse);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // API 8 — SẮP HẾT HẠN
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<InventoryBatchResponse> getExpiringBatches(int days, int page, int size) {
        LocalDate today = LocalDate.now();
        LocalDate threshold = today.plusDays(days > 0 ? days : DEFAULT_EXPIRING_DAYS);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "expiryDate"));
        Page<InventoryBatch> result = batchRepository.findExpiringBatches(today, threshold, pageable);
        return toPageResponse(result, this::toBatchResponse);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // API 9 — HẾT HÀNG
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<OutOfStockVariantResponse> getOutOfStockVariants(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ProductVariant> result = variantRepository.findOutOfStockVariants(LocalDate.now(), pageable);
        return toPageResponse(result, this::toOutOfStockResponse);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MAPPERS
    // ─────────────────────────────────────────────────────────────────────────

    private InventoryBatchResponse toBatchResponse(InventoryBatch b) {
        ProductVariant v = b.getVariant();
        boolean lowAlert = b.getLowStockThreshold() != null
                && b.getRemainingQuantity() != null
                && b.getRemainingQuantity() <= b.getLowStockThreshold();

        return InventoryBatchResponse.builder()
                .id(b.getId())
                .variantId(v.getId())
                .productId(v.getProduct().getId())
                .productName(v.getProduct().getName())
                .variantName(v.getVariantName())
                .sku(v.getSku())
                .batchNumber(b.getBatchNumber())
                .expiryDate(b.getExpiryDate())
                .manufactureDate(b.getManufactureDate())
                .importPrice(b.getImportPrice())
                .remainingQuantity(b.getRemainingQuantity())
                .lowStockThreshold(b.getLowStockThreshold())
                .lastStockUpdate(b.getLastStockUpdate())
                .lowStockAlert(lowAlert)
                .build();
    }

    private InventoryTransactionResponse toTransactionResponse(InventoryTransaction t) {
        ProductVariant v = t.getVariant();
        InventoryBatch b = t.getBatch();
        return InventoryTransactionResponse.builder()
                .id(t.getId())
                .type(t.getType())
                .variantId(v.getId())
                .productName(v.getProduct().getName())
                .variantName(v.getVariantName())
                .sku(v.getSku())
                .batchId(b.getId())
                .batchNumber(b.getBatchNumber())
                .quantity(t.getQuantity())
                .referenceId(t.getReferenceId())
                .createdAt(t.getCreatedAt())
                .build();
    }

    private OutOfStockVariantResponse toOutOfStockResponse(ProductVariant v) {
        return OutOfStockVariantResponse.builder()
                .variantId(v.getId())
                .productId(v.getProduct().getId())
                .productName(v.getProduct().getName())
                .variantName(v.getVariantName())
                .sku(v.getSku())
                .price(v.getPrice())
                .active(v.isActive())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private Sort buildSort(String sortBy, String sortDir) {
        String field = switch (sortBy == null ? "" : sortBy) {
            case "expiryDate"    -> "expiryDate";
            case "remainingQty"  -> "remainingQuantity";
            case "lastStockUpdate" -> "lastStockUpdate";
            default              -> "lastStockUpdate";
        };
        Sort.Direction dir = "asc".equalsIgnoreCase(sortDir)
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(dir, field);
    }

    /** Generic helper chuyển Page<E> → PageResponse<R> */
    private <E, R> PageResponse<R> toPageResponse(Page<E> page,
                                                    java.util.function.Function<E, R> mapper) {
        return PageResponse.<R>builder()
                .content(page.getContent().stream().map(mapper).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
