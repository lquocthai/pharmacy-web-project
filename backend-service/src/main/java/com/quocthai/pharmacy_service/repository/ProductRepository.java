package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {

    @Query(
        value = "SELECT DISTINCT p FROM Product p " +
                "LEFT JOIN p.images i " +
                "WHERE p.category.slug = :slug " +
                "AND (i IS NULL OR i.isPrimary = true)",
        countQuery = "SELECT COUNT(DISTINCT p) FROM Product p " +
                     "WHERE p.category.slug = :slug"
    )
    Page<Product> findByCategorySlug(@Param("slug") String slug, Pageable pageable);

    @Query("SELECT COUNT(p) > 0 FROM Product p WHERE p.category.slug = :slug")
    boolean existsByCategorySlug(@Param("slug") String slug);

    // Lấy product detail theo slug — JOIN FETCH category + productDetail
    // Không FETCH images/inventories ở đây để tránh MultiBag — tách query riêng
    @Query("""
        SELECT p FROM Product p
        LEFT JOIN FETCH p.category c
        LEFT JOIN FETCH p.productDetail pd
        WHERE p.slug = :slug
        """)
    Optional<Product> findBySlugWithDetail(@Param("slug") String slug);
}
