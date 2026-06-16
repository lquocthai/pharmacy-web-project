package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.RatingReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RatingReplyRepository extends JpaRepository<RatingReply, String> {

    // Lấy tất cả replies của nhiều ratingId cùng lúc — tránh N+1
    // JOIN FETCH repliedBy để lấy username dược sĩ
    @Query("""
        SELECT rr FROM RatingReply rr
        JOIN FETCH rr.repliedBy u
        WHERE rr.rating.id IN :ratingIds
        ORDER BY rr.createdAt ASC
        """)
    List<RatingReply> findByRatingIds(@Param("ratingIds") List<String> ratingIds);
}
