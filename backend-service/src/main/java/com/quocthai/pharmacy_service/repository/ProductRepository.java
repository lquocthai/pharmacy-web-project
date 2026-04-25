package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {

    /**
     * Tìm sản phẩm theo slug của Category với phân trang.
     *
     * Dùng JOIN FETCH để tránh N+1 query khi load images.
     * Chỉ lấy ảnh primary (isPrimary = true) hoặc sản phẩm không có ảnh nào.
     *
     * Lưu ý: không dùng FETCH JOIN kết hợp với Pageable trực tiếp vì Hibernate
     * sẽ load toàn bộ dữ liệu vào memory rồi mới phân trang (HHH90003004 warning).
     * Giải pháp: tách thành 2 query — countQuery riêng để Hibernate đếm đúng.
     */
    @Query(
        value = "SELECT DISTINCT p FROM Product p " +
                "LEFT JOIN p.images i " +
                "WHERE p.category.slug = :slug " +
                "AND (i IS NULL OR i.isPrimary = true)",
        countQuery = "SELECT COUNT(DISTINCT p) FROM Product p " +
                     "WHERE p.category.slug = :slug"
    )
    Page<Product> findByCategorySlug(@Param("slug") String slug, Pageable pageable);

    /**
     * Kiểm tra category slug có tồn tại không — tránh query sản phẩm khi slug sai.
     */
    @Query("SELECT COUNT(p) > 0 FROM Product p WHERE p.category.slug = :slug")
    boolean existsByCategorySlug(@Param("slug") String slug);
}
