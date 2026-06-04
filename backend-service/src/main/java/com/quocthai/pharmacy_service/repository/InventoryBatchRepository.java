package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.InventoryBatch;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, String> {

    // ── Tồn kho ──────────────────────────────────────────────────────────────

    @Query("""
        SELECT COALESCE(SUM(ib.remainingQuantity), 0)
        FROM InventoryBatch ib
        WHERE ib.variant.id = :variantId
          AND ib.expiryDate > :today
          AND ib.remainingQuantity > 0
    """)
    int getTotalStockByVariantId(
            @Param("variantId") String variantId,
            @Param("today") LocalDate today);

    @Query("""
        SELECT ib.variant.id, COALESCE(SUM(ib.remainingQuantity), 0)
        FROM InventoryBatch ib
        WHERE ib.variant.id IN :variantIds
          AND ib.expiryDate > :today
          AND ib.remainingQuantity > 0
        GROUP BY ib.variant.id
    """)
    List<Object[]> getStockMapByVariantIds(
            @Param("variantIds") List<String> variantIds,
            @Param("today") LocalDate today);

    // ── FEFO + lock chống oversell ────────────────────────────────────────────

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT ib
        FROM InventoryBatch ib
        WHERE ib.variant.id = :variantId
          AND ib.expiryDate > :today
          AND ib.remainingQuantity > 0
        ORDER BY ib.expiryDate ASC
    """)
    List<InventoryBatch> findAvailableBatchesForUpdate(
            @Param("variantId") String variantId,
            @Param("today") LocalDate today);

    // ── Tra cứu batch theo variant + batchNumber ──────────────────────────────

    Optional<InventoryBatch> findByVariantIdAndBatchNumber(String variantId, String batchNumber);

    // ── Admin: tìm kiếm lô hàng (JPQL động) ─────────────────────────────────

    /**
     * Search lô hàng với filter đầy đủ. JOIN FETCH để tránh N+1 khi lấy variant + product.
     */
    @Query("""
        SELECT ib
        FROM InventoryBatch ib
        JOIN FETCH ib.variant v
        JOIN FETCH v.product p
        WHERE
            (:keyword   IS NULL OR LOWER(p.name)        LIKE LOWER(CONCAT('%', :keyword, '%'))
                                OR LOWER(v.sku)          LIKE LOWER(CONCAT('%', :keyword, '%'))
                                OR LOWER(ib.batchNumber) LIKE LOWER(CONCAT('%', :keyword, '%')))
        AND (:variantId   IS NULL OR v.id          = :variantId)
        AND (:batchNumber IS NULL OR ib.batchNumber = :batchNumber)
        AND (:expiryFrom  IS NULL OR ib.expiryDate >= :expiryFrom)
        AND (:expiryTo    IS NULL OR ib.expiryDate <= :expiryTo)
    """)
    Page<InventoryBatch> searchBatches(
            @Param("keyword")     String keyword,
            @Param("variantId")   String variantId,
            @Param("batchNumber") String batchNumber,
            @Param("expiryFrom")  LocalDate expiryFrom,
            @Param("expiryTo")    LocalDate expiryTo,
            Pageable pageable);

    // ── Dashboard queries ────────────────────────────────────────────────────

    /** Tổng tồn kho khả dụng toàn hệ thống */
    @Query("""
        SELECT COALESCE(SUM(ib.remainingQuantity), 0)
        FROM InventoryBatch ib
        WHERE ib.expiryDate > :today
          AND ib.remainingQuantity > 0
    """)
    long sumTotalAvailableStock(@Param("today") LocalDate today);

    /** Số lô tồn thấp (remainingQuantity <= lowStockThreshold) */
    @Query("""
        SELECT COUNT(ib)
        FROM InventoryBatch ib
        WHERE ib.lowStockThreshold IS NOT NULL
          AND ib.remainingQuantity <= ib.lowStockThreshold
          AND ib.remainingQuantity > 0
    """)
    long countLowStockBatches();

    /** Số lô sắp hết hạn trong N ngày */
    @Query("""
        SELECT COUNT(ib)
        FROM InventoryBatch ib
        WHERE ib.expiryDate > :today
          AND ib.expiryDate <= :expiryThreshold
          AND ib.remainingQuantity > 0
    """)
    long countExpiringBatches(
            @Param("today") LocalDate today,
            @Param("expiryThreshold") LocalDate expiryThreshold);

    /** Variant IDs còn hàng (để tính out-of-stock = tổng variant - số này) */
    @Query("""
        SELECT DISTINCT ib.variant.id
        FROM InventoryBatch ib
        WHERE ib.expiryDate > :today
          AND ib.remainingQuantity > 0
    """)
    List<String> findVariantIdsWithStock(@Param("today") LocalDate today);

    // ── Cảnh báo: tồn thấp ──────────────────────────────────────────────────

    @Query("""
        SELECT ib
        FROM InventoryBatch ib
        JOIN FETCH ib.variant v
        JOIN FETCH v.product p
        WHERE ib.lowStockThreshold IS NOT NULL
          AND ib.remainingQuantity <= ib.lowStockThreshold
          AND ib.remainingQuantity > 0
        ORDER BY ib.remainingQuantity ASC
    """)
    Page<InventoryBatch> findLowStockBatches(Pageable pageable);

    // ── Cảnh báo: sắp hết hạn ────────────────────────────────────────────────

    @Query("""
        SELECT ib
        FROM InventoryBatch ib
        JOIN FETCH ib.variant v
        JOIN FETCH v.product p
        WHERE ib.expiryDate > :today
          AND ib.expiryDate <= :expiryThreshold
          AND ib.remainingQuantity > 0
        ORDER BY ib.expiryDate ASC
    """)
    Page<InventoryBatch> findExpiringBatches(
            @Param("today") LocalDate today,
            @Param("expiryThreshold") LocalDate expiryThreshold,
            Pageable pageable);
}
