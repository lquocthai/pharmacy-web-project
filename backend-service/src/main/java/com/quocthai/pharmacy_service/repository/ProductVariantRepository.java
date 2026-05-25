package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, String> {
    // Bạn có thể bổ sung tìm kiếm Variant theo mã SKU nếu sau này FE gửi mã SKU lên thay vì ID
    Optional<ProductVariant> findBySku(String sku);

    List<ProductVariant> findAllByProductIdIn(List<String> productIds
    );
}