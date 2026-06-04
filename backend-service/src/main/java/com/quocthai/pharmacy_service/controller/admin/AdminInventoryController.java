package com.quocthai.pharmacy_service.controller.admin;

import com.quocthai.pharmacy_service.constants.InventoryTransactionType;
import com.quocthai.pharmacy_service.dto.admin.request.ImportInventoryRequest;
import com.quocthai.pharmacy_service.dto.admin.request.UpdateBatchRequest;
import com.quocthai.pharmacy_service.dto.admin.response.*;
import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.PageResponse;
import com.quocthai.pharmacy_service.service.AdminInventoryService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/admin/inventory")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminInventoryController {

    AdminInventoryService inventoryService;

    // ─────────────────────────────────────────────────────────────────────────
    // GET /admin/inventory/dashboard
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Tổng quan kho: tổng variant, lô hàng, tồn kho,
     * cảnh báo tồn thấp, sắp hết hạn, hết hàng.
     */
    @GetMapping("/dashboard")
    public ApiResponse<InventoryDashboardResponse> getDashboard() {
        return ApiResponse.<InventoryDashboardResponse>builder()
                .result(inventoryService.getDashboard())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /admin/inventory/batches
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Danh sách lô hàng với filter: keyword, variantId, batchNumber, expiryFrom/To.
     * Pagination + sort (expiryDate ASC mặc định).
     */
    @GetMapping("/batches")
    public ApiResponse<PageResponse<InventoryBatchResponse>> getBatches(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String variantId,
            @RequestParam(required = false) String batchNumber,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate expiryFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate expiryTo,
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "20")  int size,
            @RequestParam(defaultValue = "expiryDate") String sortBy,
            @RequestParam(defaultValue = "asc")        String sortDir) {

        return ApiResponse.<PageResponse<InventoryBatchResponse>>builder()
                .result(inventoryService.getBatches(
                        keyword, variantId, batchNumber,
                        expiryFrom, expiryTo,
                        page, size, sortBy, sortDir))
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /admin/inventory/batches/{id}
    // ─────────────────────────────────────────────────────────────────────────

    /** Chi tiết một lô hàng. */
    @GetMapping("/batches/{id}")
    public ApiResponse<InventoryBatchResponse> getBatchById(@PathVariable String id) {
        return ApiResponse.<InventoryBatchResponse>builder()
                .result(inventoryService.getBatchById(id))
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /admin/inventory/import
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Nhập kho lô mới hoặc cộng dồn vào lô đã có cùng batchNumber + variantId.
     * Tự động tạo InventoryTransaction type = IMPORT.
     */
        @PostMapping("/import")
    public ApiResponse<InventoryBatchResponse> importStock(
            @Valid @RequestBody ImportInventoryRequest request) {
        return ApiResponse.<InventoryBatchResponse>builder()
                .result(inventoryService.importStock(request))
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /admin/inventory/batches/{id}
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Sửa thông tin lô: expiryDate, manufactureDate, lowStockThreshold.
     * Không cho sửa variant, batchNumber.
     */
    @PutMapping("/batches/{id}")
    public ApiResponse<InventoryBatchResponse> updateBatch(
            @PathVariable String id,
            @Valid @RequestBody UpdateBatchRequest request) {
        return ApiResponse.<InventoryBatchResponse>builder()
                .result(inventoryService.updateBatch(id, request))
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /admin/inventory/transactions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Lịch sử giao dịch kho: filter type, variantId, fromDate, toDate.
     * Sort createdAt DESC.
     */
    @GetMapping("/transactions")
    public ApiResponse<PageResponse<InventoryTransactionResponse>> getTransactions(
            @RequestParam(required = false) InventoryTransactionType type,
            @RequestParam(required = false) String variantId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        return ApiResponse.<PageResponse<InventoryTransactionResponse>>builder()
                .result(inventoryService.getTransactions(
                        type, variantId, fromDate, toDate, page, size))
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /admin/inventory/low-stock
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Danh sách lô tồn thấp: remainingQuantity <= lowStockThreshold.
     * Sort remainingQuantity ASC (ưu tiên lô cần nhập nhất lên đầu).
     */
    @GetMapping("/low-stock")
    public ApiResponse<PageResponse<InventoryBatchResponse>> getLowStock(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.<PageResponse<InventoryBatchResponse>>builder()
                .result(inventoryService.getLowStockBatches(page, size))
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /admin/inventory/expiring?days=90
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Danh sách lô sắp hết hạn trong N ngày tới (mặc định 90).
     * Sort expiryDate ASC (gần hết hạn nhất lên đầu).
     */
    @GetMapping("/expiring")
    public ApiResponse<PageResponse<InventoryBatchResponse>> getExpiring(
            @RequestParam(defaultValue = "90") int days,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.<PageResponse<InventoryBatchResponse>>builder()
                .result(inventoryService.getExpiringBatches(days, page, size))
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /admin/inventory/out-of-stock
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Danh sách variant hết hàng hoàn toàn (không có batch nào còn hàng + còn hạn).
     */
    @GetMapping("/out-of-stock")
    public ApiResponse<PageResponse<OutOfStockVariantResponse>> getOutOfStock(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.<PageResponse<OutOfStockVariantResponse>>builder()
                .result(inventoryService.getOutOfStockVariants(page, size))
                .build();
    }
}
