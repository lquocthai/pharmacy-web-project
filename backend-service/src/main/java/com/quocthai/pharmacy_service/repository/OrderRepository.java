package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.constants.OrderStatus;
import com.quocthai.pharmacy_service.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {

    /**
     * Lấy danh sách đơn hàng của user theo email, lọc theo status (optional).
     * Không FETCH items/statusHistory ở đây — tách query riêng để tránh MultiBag.
     */
    @Query("""
    SELECT o FROM Order o
    WHERE o.user.email = :email
    AND (:status IS NULL OR o.status = :status)
    ORDER BY o.createdAt DESC
""")
    List<Order> findByUserEmail(
            @Param("email") String email,
            @Param("status") OrderStatus status
    );

    /**
     * Lấy chi tiết 1 đơn hàng — ownership check ngay trong query.
     * Không FETCH items/statusHistory — tách query riêng.
     */
    @Query("""
        SELECT o FROM Order o
        WHERE o.id = :orderId
        AND o.user.email = :email
        """)
    Optional<Order> findByIdAndUserEmail(
            @Param("orderId") String orderId,
            @Param("email") String email);

    /**
     * Kiểm tra orderCode đã tồn tại chưa — dùng khi generate mã đơn hàng.
     */
    boolean existsByOrderCode(String orderCode);
}
