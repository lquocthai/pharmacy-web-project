package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.ProductSpecification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductSpecificationRepository extends JpaRepository<ProductSpecification, String> {

    // Lấy thông số theo productId và tự động sắp xếp theo thứ tự hiển thị của bạn
    @Query("SELECT ps FROM ProductSpecification ps WHERE ps.product.id = :productId ORDER BY ps.displayOrder ASC")
    List<ProductSpecification> findAllByProductIdOrderByDisplayOrder(@Param("productId") String productId);
}