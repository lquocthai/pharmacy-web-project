package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, String> {

    // Tính tổng tồn kho của 1 sản phẩm (gộp tất cả các lô)
    @Query("SELECT COALESCE(SUM(i.stockQuantity), 0) FROM Inventory i WHERE i.product.id = :productId")
    int getTotalStockByProductId(@Param("productId") String productId);

    @Query("""
    SELECT i.product.id, SUM(i.stockQuantity)
    FROM Inventory i
    WHERE i.product.id IN :productIds
    GROUP BY i.product.id
    """)
    List<Object[]> getStockMap(@Param("productIds") List<String> productIds);

    /**
     * Lấy các lô tồn kho của 1 sản phẩm, sort theo expiryDate ASC (FIFO).
     * Chỉ lấy lô còn hàng (stockQuantity > 0).
     * lock raw lại đợi user A commit trước mới tới user B
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
    SELECT i FROM Inventory i
    WHERE i.product.id = :productId
    AND i.stockQuantity > 0
    ORDER BY i.expiryDate ASC
    """)
    List<Inventory> findAvailableBatchesByProductId(@Param("productId") String productId);
}
