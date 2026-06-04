package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, String> {
    // Bạn có thể bổ sung tìm kiếm Variant theo mã SKU nếu sau này FE gửi mã SKU lên thay vì ID
    Optional<ProductVariant> findBySku(String sku);

    List<ProductVariant> findAllByProductIdIn(List<String> productIds);

    @Query("""
    SELECT DISTINCT pv
    FROM ProductVariant pv
    JOIN FETCH pv.product
    WHERE pv.id IN :ids
    """)
    List<ProductVariant> findAllWithProductByIds(
            @Param("ids") List<String> ids
    );

    /**
     * Lấy danh sách variant hết hàng: không có batch nào còn hàng và còn hạn.
     * Dùng cho API out-of-stock.
     * JOIN FETCH product để tránh N+1 khi map sang DTO.
     */
    @Query("""
        SELECT pv
        FROM ProductVariant pv
        JOIN FETCH pv.product p
        WHERE pv.id NOT IN (
            SELECT DISTINCT ib.variant.id
            FROM InventoryBatch ib
            WHERE ib.expiryDate > :today
              AND ib.remainingQuantity > 0
        )
        ORDER BY p.name ASC, pv.variantName ASC
    """)
    org.springframework.data.domain.Page<ProductVariant> findOutOfStockVariants(
            @Param("today") java.time.LocalDate today,
            org.springframework.data.domain.Pageable pageable);
}