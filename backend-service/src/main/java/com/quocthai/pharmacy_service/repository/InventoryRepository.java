package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
}
