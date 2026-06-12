package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.ProductVariant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, String> {


    List<ProductVariant> findAllByProductIdIn(List<String> productIds);

    @Query("""
    SELECT DISTINCT pv
    FROM ProductVariant pv
    JOIN FETCH pv.product
    WHERE pv.id IN :ids
    AND pv.active IS TRUE
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
    Page<ProductVariant> findOutOfStockVariants(
            @Param("today") LocalDate today,
            Pageable pageable);
    @Query("""
    SELECT pv
    FROM ProductVariant pv
    JOIN FETCH pv.product p
    WHERE pv.id = :id
    """)
    Optional<ProductVariant> findByIdWithProduct(String id);

}