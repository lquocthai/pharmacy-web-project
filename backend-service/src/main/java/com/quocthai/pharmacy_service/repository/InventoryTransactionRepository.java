package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.constants.InventoryTransactionType;
import com.quocthai.pharmacy_service.entity.InventoryTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface InventoryTransactionRepository
        extends JpaRepository<InventoryTransaction, String> {

    /**
     * Tìm kiếm lịch sử giao dịch kho với filter động.
     * JOIN FETCH để tránh N+1 khi đọc batch + variant + product.
     */
    @Query("""
        SELECT t
        FROM InventoryTransaction t
        JOIN FETCH t.batch b
        JOIN FETCH t.variant v
        JOIN FETCH v.product p
        WHERE
            (:type      IS NULL OR t.type       = :type)
        AND (:variantId IS NULL OR v.id          = :variantId)
        AND (:fromDate  IS NULL OR t.createdAt  >= :fromDate)
        AND (:toDate    IS NULL OR t.createdAt  <= :toDate)
        ORDER BY t.createdAt DESC
    """)
    Page<InventoryTransaction> searchTransactions(
            @Param("type")      InventoryTransactionType type,
            @Param("variantId") String variantId,
            @Param("fromDate")  LocalDateTime fromDate,
            @Param("toDate")    LocalDateTime toDate,
            Pageable pageable);
}
