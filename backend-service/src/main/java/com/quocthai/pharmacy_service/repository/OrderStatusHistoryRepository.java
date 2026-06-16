package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.OrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, String> {

    /**
     * Lấy toàn bộ lịch sử trạng thái của nhiều orderId cùng lúc — tránh N+1.
     */
    @Query("""
        SELECT h FROM OrderStatusHistory h
        WHERE h.order.id IN :orderIds
        ORDER BY h.changedAt ASC
        """)
    List<OrderStatusHistory> findByOrderIds(@Param("orderIds") List<String> orderIds);

    /**
     * Lấy lịch sử của 1 đơn hàng cụ thể.
     */
    @Query("""
        SELECT h FROM OrderStatusHistory h
        WHERE h.order.id = :orderId
        ORDER BY h.changedAt ASC
        """)
    List<OrderStatusHistory> findByOrderId(@Param("orderId") String orderId);
}
