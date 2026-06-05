package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.constants.RatingStatus;
import com.quocthai.pharmacy_service.entity.Rating;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PharmacistRatingRepository extends JpaRepository<Rating, String> {

    // ── Lấy danh sách rating cho dược sĩ, lọc theo status, star, tên sản phẩm, khoảng thời gian ──
    @Query(value = """
        SELECT DISTINCT r FROM Rating r
        JOIN FETCH r.product p
        JOIN FETCH p.images
        JOIN FETCH r.user u
        WHERE (:status IS NULL OR r.status = :status)
        AND (:star IS NULL OR r.star = :star)
        AND (:productName IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :productName, '%')))
        AND (:fromDate IS NULL OR r.createdAt >= :fromDate)
        AND (:toDate IS NULL OR r.createdAt <= :toDate)
        ORDER BY r.createdAt DESC
        """,
        countQuery = """
        SELECT COUNT(r) FROM Rating r
        JOIN r.product p
        WHERE (:status IS NULL OR r.status = :status)
        AND (:star IS NULL OR r.star = :star)
        AND (:productName IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :productName, '%')))
        AND (:fromDate IS NULL OR r.createdAt >= :fromDate)
        AND (:toDate IS NULL OR r.createdAt <= :toDate)
        """)
    Page<Rating> findForPharmacist(
            @Param("status") RatingStatus status,
            @Param("star") Integer star,
            @Param("productName") String productName,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable);

    // ── Lấy chi tiết rating kèm replies cho dược sĩ ──────────────────────────
    @Query("""
        SELECT r FROM Rating r
        JOIN FETCH r.product p
        JOIN FETCH r.user u
        LEFT JOIN FETCH r.replies rp
        LEFT JOIN FETCH rp.repliedBy
        WHERE r.id = :ratingId
        """)
    Optional<Rating> findDetailById(@Param("ratingId") String ratingId);
}
