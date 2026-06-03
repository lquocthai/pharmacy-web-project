package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.InventoryBatch;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, String> {

    /**
     * Tổng tồn kho của 1 variant từ các lô chưa hết hạn.
     */
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

    /**
     * Tổng tồn kho hàng loạt variant — dùng cho validate giỏ hàng/đặt hàng.
     * Trả về [variantId, totalStock].
     */
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

    /**
     * FEFO — lấy các lô còn hàng, còn hạn, sắp xếp hạn gần nhất trước.
     * PESSIMISTIC_WRITE: khóa row-level trong DB để chống oversell khi nhiều request đồng thời.
     *
     * Khi transaction A đang hold lock, transaction B sẽ bị block cho đến khi A commit/rollback.
     * → Đảm bảo chỉ 1 request được trừ kho tại một thời điểm với cùng batch.
     */
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
}
