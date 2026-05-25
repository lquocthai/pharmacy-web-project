package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {

    /**
     * Lấy danh sách productId phân trang theo category slug.
     *
     * Logic:
     * - Nếu category là cấp 2 (có parent): lấy sản phẩm thuộc đúng category đó.
     * - Nếu category là cấp 1 (parent = null): lấy sản phẩm thuộc category đó
     *   VÀ tất cả sản phẩm thuộc các category con (cấp 2) của nó.
     *
     * Chỉ lấy productId — không FETCH images/variants để tránh MultiBag.
     * countQuery riêng để Hibernate đếm đúng khi phân trang.
     */
    @Query(
        value = """
            SELECT p.id FROM Product p
            WHERE p.active = true
            AND (
                p.category.slug = :slug
                OR p.category.parent.slug = :slug
            )
            ORDER BY p.name ASC
            """,
        countQuery = """
            SELECT COUNT(p) FROM Product p
            WHERE p.active = true
            AND (
                p.category.slug = :slug
                OR p.category.parent.slug = :slug
            )
            """
    )
    Page<String> findProductIdsByCategorySlug(@Param("slug") String slug, Pageable pageable);

    /**
     * Lấy danh sách Product theo list id — dùng sau khi đã phân trang productIds.
     * Không FETCH images/variants ở đây — tách query riêng để tránh N+1.
     */
    @Query("""
        SELECT p FROM Product p
        LEFT JOIN FETCH p.category c
        WHERE p.id IN :ids
        """)
    List<Product> findByIdsWithCategory(@Param("ids") List<String> ids);

    /**
     * Lấy product detail theo slug — JOIN FETCH category.
     * Không FETCH images/variants/specifications — tách query riêng.
     */
    @Query("""
        SELECT p FROM Product p
        LEFT JOIN FETCH p.category c
        WHERE p.slug = :slug AND p.active = true
        """)
    Optional<Product> findBySlugWithDetail(@Param("slug") String slug);

    // Category cấp 1
    Page<Product> findByCategoryIdOrCategoryParentId(
            String categoryId,
            String parentId,
            Pageable pageable
    );

    // Category cấp 2
    Page<Product> findByCategoryId(
            String categoryId,
            Pageable pageable
    );
}
