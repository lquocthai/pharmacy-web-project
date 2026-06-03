package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.InventoryAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository  // fix: was incorrectly annotated with @Controller
public interface InventoryAllocationRepository
        extends JpaRepository<InventoryAllocation, String> {

    /**
     * Lấy tất cả allocation của một order kèm batch — dùng khi hoàn kho.
     * JOIN FETCH batch để tránh N+1 khi truy cập batch.remainingQuantity.
     */
    @Query("""
        SELECT ia
        FROM InventoryAllocation ia
        JOIN FETCH ia.batch
        WHERE ia.orderItem.order.id = :orderId
    """)
    List<InventoryAllocation> findWithBatchByOrderId(@Param("orderId") String orderId);

    /**
     * Lấy allocation theo orderItemId — dùng để kiểm tra allocation của từng item.
     */
    @Query("""
        SELECT ia
        FROM InventoryAllocation ia
        JOIN FETCH ia.batch
        WHERE ia.orderItem.id = :orderItemId
    """)
    List<InventoryAllocation> findWithBatchByOrderItemId(@Param("orderItemId") String orderItemId);
}
