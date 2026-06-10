package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.constants.RatingStatus;
import com.quocthai.pharmacy_service.entity.Rating;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, String> {

    // ── Lấy danh sách rating theo productId, lọc theo star (optional) ─────────
    // JOIN FETCH user để tránh N+1 khi lấy username
    // Không FETCH replies ở đây — tách query riêng để tránh MultiBag
    @Query("""
        SELECT r FROM Rating r
        JOIN FETCH r.user u
        WHERE r.product.id = :productId
        AND r.status = :status
        AND (:star IS NULL OR r.star = :star)
        ORDER BY r.createdAt DESC
        """)
    Page<Rating> findByProductId(
            @Param("productId") String productId,
            @Param("star") Integer star,
            Pageable pageable,
            RatingStatus status
    );

    // ── Tính aggregate: averageRating + count theo từng sao ───────────────────
    // Trả về Object[]: [star(int), count(long)]
    @Query("""
        SELECT r.star, COUNT(r)
        FROM Rating r
        WHERE r.product.id = :productId
        GROUP BY r.star
        """)
    List<Object[]> getRatingBreakdown(@Param("productId") String productId);

    // ── Kiểm tra user đã đánh giá sản phẩm này chưa ──────────────────────────
    @Query("""
        SELECT r FROM Rating r
        WHERE r.product.id = :productId
        AND r.user.email = :email
        """)
    Optional<Rating> findByProductIdAndUserEmail(
            @Param("productId") String productId,
            @Param("email") String email);

    // ── Kiểm tra ownership khi update/delete ──────────────────────────────────
    @Query("""
        SELECT r FROM Rating r
        WHERE r.id = :ratingId
        AND r.user.email = :email
        """)
    Optional<Rating> findOwnedRating(
            @Param("ratingId") String ratingId,
            @Param("email") String email);

    // ── Dashboard stats ────────────────────────────────────────────────────

    /** Tổng số đánh giá */
    long countByStatus(RatingStatus status);

    /** Điểm trung bình toàn hệ thống */
    @Query("""
    SELECT COALESCE(AVG(r.star), 0.0)
    FROM Rating r
    WHERE r.status = :status
""")
    double getAverageRating(@Param("status") RatingStatus status);

    /** Phân phối sao — trả về [star(int), count(long)] */
    @Query("""
    SELECT r.star, COUNT(r)
    FROM Rating r
    WHERE r.status = :status
    GROUP BY r.star
    ORDER BY r.star
""")
    List<Object[]> getRatingDistribution(
            @Param("status") RatingStatus status
    );

    /** Top sản phẩm được đánh giá — trả về [productName, avgStar, count] */
    @Query("""
    SELECT r.product.name, AVG(r.star), COUNT(r)
    FROM Rating r
    WHERE r.status = :status
    GROUP BY r.product.id, r.product.name
    ORDER BY COUNT(r) DESC
""")
    List<Object[]> getTopRatedProducts(
            @Param("status") RatingStatus status,
            Pageable pageable
    );
}
