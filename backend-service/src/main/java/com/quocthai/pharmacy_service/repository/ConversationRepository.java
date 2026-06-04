package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, String> {

    // ── User ──────────────────────────────────────────────────────────────────

    /** Tìm conversation OPEN (PENDING / IN_PROGRESS) của user — để tái sử dụng khi user nhắn lại */
    @Query("""
        SELECT c FROM Conversation c
        WHERE c.userId = :userId
          AND c.status IN (
              com.quocthai.pharmacy_service.entity.Conversation.ConversationStatus.PENDING,
              com.quocthai.pharmacy_service.entity.Conversation.ConversationStatus.IN_PROGRESS
          )
        ORDER BY c.lastMessageAt DESC
    """)
    List<Conversation> findOpenByUserId(@Param("userId") String userId);

    /** Lịch sử tất cả conversation của user, phân trang */
    Page<Conversation> findByUserIdOrderByLastMessageAtDesc(String userId, Pageable pageable);

    // ── Pharmacist / Admin ────────────────────────────────────────────────────

    /** Danh sách hội thoại theo status (dùng cho waiting-list) */
    Page<Conversation> findByStatusOrderByLastMessageAtDesc(
            Conversation.ConversationStatus status, Pageable pageable);

    /** Tất cả status + phân trang cho admin */
    Page<Conversation> findAllByOrderByLastMessageAtDesc(Pageable pageable);

    // ── Scheduler ────────────────────────────────────────────────────────────

    /**
     * Tìm conversation RESOLVED không có tin nhắn mới trong N ngày.
     * Dùng cho scheduler auto-close.
     */
    @Query("""
        SELECT c FROM Conversation c
        WHERE c.status = com.quocthai.pharmacy_service.entity.Conversation.ConversationStatus.RESOLVED
          AND c.lastMessageAt < :threshold
    """)
    List<Conversation> findResolvedInactiveSince(@Param("threshold") LocalDateTime threshold);

    // ── Ownership helpers ─────────────────────────────────────────────────────

    Optional<Conversation> findByIdAndUserId(String id, String userId);
}
