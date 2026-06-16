package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
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
    // NÂNG CẤP HÀM CHO CATEGORY CẤP 1 (CHA)
    @Query("SELECT p FROM Product p WHERE " +
            "(p.category.id = :categoryId OR p.category.parent.id = :parentId) " +
            "AND p.active = true "+
            "AND (:manufacturer IS NULL OR :manufacturer = '' OR p.manufacturer = :manufacturer) " +
            "AND (:country IS NULL OR :country = '' OR p.country = :country) " +
            "AND (:minPrice IS NULL OR p.priceDefault >= :minPrice) " +
            "AND (:maxPrice IS NULL OR p.priceDefault <= :maxPrice)")
    Page<Product> findByCategoryIdOrCategoryParentId(
            @Param("categoryId") String categoryId,
            @Param("parentId") String parentId,
            @Param("manufacturer") String manufacturer,
            @Param("country") String country,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable
    );

    // NÂNG CẤP HÀM CHO CATEGORY CẤP 2 (CON)
    @Query("SELECT p FROM Product p WHERE " +
            "p.category.id = :categoryId " +
            "AND p.active = true "+
            "AND (:manufacturer IS NULL OR :manufacturer = '' OR p.manufacturer = :manufacturer) " +
            "AND (:country IS NULL OR :country = '' OR p.country = :country) " +
            "AND (:minPrice IS NULL OR p.priceDefault >= :minPrice) " +
            "AND (:maxPrice IS NULL OR p.priceDefault <= :maxPrice)")
    Page<Product> findByCategoryId(
            @Param("categoryId") String categoryId,
            @Param("manufacturer") String manufacturer,
            @Param("country") String country,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable
    );


    // admin
    @Query("""
    SELECT p FROM Product p
    LEFT JOIN p.category c
    WHERE
        (
            :keyword IS NULL OR
            LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
         )
    AND
        (
            :categoryIds IS NULL OR
            c.id IN :categoryIds
         )
    """)
    Page<Product> searchAdminProducts(
            @Param("keyword") String keyword,
            @Param("categoryIds") List<String> categoryIds,
            Pageable pageable
    );

    // Bước 1: Fetch category và images
    @Query("SELECT DISTINCT p FROM Product p " +
            "LEFT JOIN FETCH p.category " +
            "LEFT JOIN FETCH p.images " +
            "WHERE p.id = :id")
    Optional<Product> findDetailById(@Param("id") String id);

    /**
     * Load product kèm variants trong 1 query — dùng cho updateProduct
     * để tránh LazyInitializationException khi duyệt variants.
     */
    @Query("SELECT DISTINCT p FROM Product p " +
            "LEFT JOIN FETCH p.variants " +
            "WHERE p.id = :id")
    Optional<Product> findWithVariantsById(@Param("id") String id);

    // Bước 2: Fetch riêng variants
    @Query("SELECT DISTINCT p FROM Product p " +
            "LEFT JOIN FETCH p.variants " +
            "WHERE p.id = :id")
    Optional<Product> fetchVariantsDetail(@Param("id") String id);

    // Bước 3: Fetch riêng specifications
    @Query("SELECT DISTINCT p FROM Product p " +
            "LEFT JOIN FETCH p.specifications " +
            "WHERE p.id = :id")
    Optional<Product> fetchSpecificationsDetail(@Param("id") String id);

//    @EntityGraph(attributePaths = {
//            "category",
//            "images",
//            "variants",
//            "specifications"
//    })
//    Optional<Product> findDetailById(String id);

    boolean existsByCategoryId(String categoryId);

    boolean existsByCategoryIdIn(Collection<String> categoryIds);

    // full product to sync db mysql => elasticsearch
    @Query("SELECT p FROM Product p JOIN FETCH p.category WHERE p.active = true") // Hoặc tùy điều kiện của bạn
    List<Product> findAllBasic();

    /**
     * Load Product kèm symptoms (ElementCollection) trong 1 query
     * — tránh LazyInitializationException khi xử lý ngoài transaction.
     */
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.symptoms WHERE p.id = :id")
    Optional<Product> findByIdWithSymptoms(@Param("id") String id);

    // ── Dashboard stats ────────────────────────────────────────────────────

    /** Tổng sản phẩm active */
    long countByActiveTrue();

    /** Tổng sản phẩm kê đơn */
    long countByIsPrescriptionTrue();
}
