package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, String> {

    /**
     * Lấy tất cả items của nhiều orderId cùng lúc — tránh N+1.
     * Dùng IN clause thay vì query từng order một.
     */
    @Query("""
        SELECT oi FROM OrderItem oi
        WHERE oi.order.id IN :orderIds
        ORDER BY oi.order.id
        """)
    List<OrderItem> findByOrderIds(@Param("orderIds") List<String> orderIds);

    /**
     * Lấy items của 1 đơn hàng cụ thể.
     */
    @Query("SELECT oi FROM OrderItem oi WHERE oi.order.id = :orderId")
    List<OrderItem> findByOrderId(@Param("orderId") String orderId);
}
