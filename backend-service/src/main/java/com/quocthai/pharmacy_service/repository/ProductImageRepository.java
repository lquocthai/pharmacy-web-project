package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.ProductImage;
import com.quocthai.pharmacy_service.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductImageRepository extends JpaRepository<ProductImage, String> {

    @Query("""
    SELECT pi FROM ProductImage pi
    WHERE pi.product.id IN :productIds
    AND pi.isPrimary = true
    """)
    List<ProductImage> findPrimaryImages(@Param("productIds") List<String> productIds);

    // Lấy tất cả ảnh của 1 sản phẩm (dùng cho product detail)
    @Query("SELECT pi FROM ProductImage pi WHERE pi.product.id = :productId ORDER BY pi.isPrimary DESC")
    List<ProductImage> findAllByProductId(@Param("productId") String productId);

    List<ProductImage> findAllByProductIdInAndIsPrimaryTrue(
            List<String> productIds
    );
    @Query("""
    SELECT pi
    FROM ProductImage pi
    WHERE pi.product.id = :productId
      AND pi.isPrimary = true
    """)
    Optional<ProductImage> findDefaultImageByProductId(String productId);

    List<ProductImage> findAllByProductIdIn(List<String> productIds);
}
