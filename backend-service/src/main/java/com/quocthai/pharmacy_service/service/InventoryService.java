package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.constants.InventoryTransactionType;
import com.quocthai.pharmacy_service.entity.InventoryAllocation;
import com.quocthai.pharmacy_service.entity.InventoryBatch;
import com.quocthai.pharmacy_service.entity.InventoryTransaction;
import com.quocthai.pharmacy_service.entity.OrderItem;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.repository.InventoryAllocationRepository;
import com.quocthai.pharmacy_service.repository.InventoryBatchRepository;
import com.quocthai.pharmacy_service.repository.InventoryTransactionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Chịu trách nhiệm toàn bộ logic kho:
 * - Xuất kho theo FEFO với PESSIMISTIC_WRITE lock (chống oversell)
 * - Hoàn kho đúng batch gốc theo InventoryAllocation
 * - Ghi audit log mọi thao tác vào InventoryTransaction
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InventoryService {

    InventoryBatchRepository batchRepository;
    InventoryAllocationRepository allocationRepository;
    InventoryTransactionRepository transactionRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // XUẤT KHO — FEFO + PESSIMISTIC_WRITE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Trừ kho theo FEFO cho một danh sách OrderItem.
     * Phải gọi trong @Transactional của caller để lock có hiệu lực.
     *
     * @return danh sách InventoryAllocation đã tạo (chưa save — caller saveAll)
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public AllocateResult allocateStock(List<OrderItem> orderItems, String orderId) {
        List<InventoryAllocation> allocations = new ArrayList<>();
        List<InventoryBatch> dirtyBatches = new ArrayList<>();
        List<InventoryTransaction> txLogs = new ArrayList<>();

        for (OrderItem item : orderItems) {
            String variantId = item.getVariant().getId();
            int needed = item.getQuantity();

            // PESSIMISTIC_WRITE: lock các row batch trước khi đọc/ghi
            List<InventoryBatch> batches =
                    batchRepository.findAvailableBatchesForUpdate(variantId, LocalDate.now());

            int remaining = needed;

            for (InventoryBatch batch : batches) {
                if (remaining <= 0) break;

                int take = Math.min(batch.getRemainingQuantity(), remaining);
                batch.setRemainingQuantity(batch.getRemainingQuantity() - take);
                remaining -= take;

                allocations.add(InventoryAllocation.builder()
                        .orderItem(item)
                        .batch(batch)
                        .quantity(take)
                        .build());

                dirtyBatches.add(batch);

                txLogs.add(InventoryTransaction.builder()
                        .batch(batch)
                        .variant(batch.getVariant())
                        .type(InventoryTransactionType.EXPORT)
                        .quantity(take)
                        .referenceId(orderId)
                        .build());
            }

            if (remaining > 0) {
                // Không đủ kho sau khi đã lock — rollback toàn bộ transaction
                log.warn("Insufficient stock for variantId={}, needed={}, short={}",
                        variantId, needed, remaining);
                throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
            }
        }

        // Gom saveAll — không save trong vòng lặp
        batchRepository.saveAll(dirtyBatches);

        return new AllocateResult(allocations, txLogs);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HOÀN KHO — Trả đúng vào batch gốc
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Hoàn kho khi hủy đơn.
     * Đọc InventoryAllocation → trả đúng số lượng vào đúng batch đã lấy.
     * Phải gọi trong @Transactional của caller.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void restoreStock(String orderId) {
        List<InventoryAllocation> allocations =
                allocationRepository.findWithBatchByOrderId(orderId);

        if (allocations.isEmpty()) {
            log.warn("No allocations found for orderId={}, skip restore", orderId);
            return;
        }

        List<InventoryBatch> dirtyBatches = new ArrayList<>();
        List<InventoryTransaction> txLogs = new ArrayList<>();

        for (InventoryAllocation alloc : allocations) {
            InventoryBatch batch = alloc.getBatch();
            batch.setRemainingQuantity(batch.getRemainingQuantity() + alloc.getQuantity());
            dirtyBatches.add(batch);

            txLogs.add(InventoryTransaction.builder()
                    .batch(batch)
                    .variant(batch.getVariant())
                    .type(InventoryTransactionType.RETURN)
                    .quantity(alloc.getQuantity())
                    .referenceId(orderId)
                    .build());
        }

        batchRepository.saveAll(dirtyBatches);
        transactionRepository.saveAll(txLogs);

        log.info("Restored stock for orderId={}, batches updated={}", orderId, dirtyBatches.size());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESULT HOLDER — tránh trả nhiều collection rời
    // ─────────────────────────────────────────────────────────────────────────

    public record AllocateResult(
            List<InventoryAllocation> allocations,
            List<InventoryTransaction> txLogs
    ) {}
}
