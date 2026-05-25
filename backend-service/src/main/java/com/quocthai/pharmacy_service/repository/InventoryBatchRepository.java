package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.InventoryBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, String> {

    // Tính tổng số lượng tồn của 1 Variant dựa trên các lô chưa hết hạn
    @Query("SELECT COALESCE(SUM(ib.remainingQuantity), 0) FROM InventoryBatch ib " +
            "WHERE ib.variant.id = :variantId AND ib.expiryDate > :currentDate")
    int getTotalStockByVariantId(@Param("variantId") String variantId, @Param("currentDate") LocalDate currentDate);

    // Lấy danh sách tổng hợp tồn kho cho hàng loạt Variant ID cùng lúc để tối ưu hiệu năng trang giỏ hàng
    @Query("SELECT ib.variant.id, COALESCE(SUM(ib.remainingQuantity), 0) FROM InventoryBatch ib " +
            "WHERE ib.variant.id IN :variantIds AND ib.expiryDate > :currentDate " +
            "GROUP BY ib.variant.id")
    List<Object[]> getStockMapByVariantIds(@Param("variantIds") List<String> variantIds, @Param("currentDate") LocalDate currentDate);

    // Thuật toán FIFO: Tìm các lô hàng của SKU còn hạn sử dụng, ưu tiên hạn gần nhất lên trước (ASC)
    @Query("SELECT ib FROM InventoryBatch ib " +
            "WHERE ib.variant.id = :variantId AND ib.expiryDate > :currentDate AND ib.remainingQuantity > 0 " +
            "ORDER BY ib.expiryDate ASC")
    List<InventoryBatch> findAvailableBatchesByVariantId(
            @Param("variantId") String variantId,
            @Param("currentDate") LocalDate currentDate
    );
}