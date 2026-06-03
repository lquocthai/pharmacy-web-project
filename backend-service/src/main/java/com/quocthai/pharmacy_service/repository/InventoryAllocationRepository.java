package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.InventoryAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public interface InventoryAllocationRepository
        extends JpaRepository<InventoryAllocation, String> {

    @Query("""
        select ia
        from InventoryAllocation ia
        join fetch ia.batch
        where ia.orderItem.order.id = :orderId
    """)
    List<InventoryAllocation> findByOrderId(String orderId);
}
