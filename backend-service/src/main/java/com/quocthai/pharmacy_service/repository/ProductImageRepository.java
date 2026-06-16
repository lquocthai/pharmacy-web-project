package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.ProductImage;
import com.quocthai.pharmacy_service.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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

    /**
     * Xóa các ảnh theo danh sách ID — JPQL batch delete, tránh N+1.
     */
    @Modifying
    @Query("DELETE FROM ProductImage pi WHERE pi.id IN :ids")
    void deleteAllByIds(@Param("ids") List<String> ids);

    /**
     * Xóa ảnh chính của sản phẩm — dùng khi thay ảnh chính mới.
     */
    @Modifying
    @Query("DELETE FROM ProductImage pi WHERE pi.product.id = :productId AND pi.isPrimary = true")
    void deletePrimaryByProductId(@Param("productId") String productId);
}
