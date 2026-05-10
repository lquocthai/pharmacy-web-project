package com.quocthai.pharmacy_service.repository;

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
        AND (:star IS NULL OR r.star = :star)
        ORDER BY r.createdAt DESC
        """)
    Page<Rating> findByProductId(
            @Param("productId") String productId,
            @Param("star") Integer star,
            Pageable pageable);

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
}
