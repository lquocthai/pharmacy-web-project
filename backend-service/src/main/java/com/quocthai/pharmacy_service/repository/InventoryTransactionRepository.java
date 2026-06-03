package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryTransactionRepository
        extends JpaRepository<InventoryTransaction, String> {
}
