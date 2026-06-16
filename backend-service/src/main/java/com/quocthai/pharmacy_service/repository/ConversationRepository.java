package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, String> {

    // ── User ──────────────────────────────────────────────────────────────────

    /** Lấy conversation duy nhất của user (mỗi user chỉ có 1 conversation) */
    Optional<Conversation> findByUserId(String userId);

    /** Lịch sử tất cả conversation của user, phân trang */
    Page<Conversation> findByUserIdOrderByLastMessageAtDesc(String userId, Pageable pageable);

    // ── Pharmacist / Admin — Shared Inbox ────────────────────────────────────

    /** Tất cả conversation sắp xếp theo lastMessageAt DESC — shared inbox */
    Page<Conversation> findAllByOrderByLastMessageAtDesc(Pageable pageable);

    // ── Ownership helpers ─────────────────────────────────────────────────────

    Optional<Conversation> findByIdAndUserId(String id, String userId);

    // ── Unread management ─────────────────────────────────────────────────────

    /** Reset unreadCount về 0 khi dược sĩ mở conversation */
    @Modifying
    @Query("UPDATE Conversation c SET c.unreadCount = 0 WHERE c.id = :id")
    void resetUnreadCount(@Param("id") String id);

    // ── Dashboard stats ────────────────────────────────────────────────────

    /** Tổng số tin nhắn chưa đọc trên toàn bộ hội thoại */
    @Query("SELECT COALESCE(SUM(c.unreadCount), 0) FROM Conversation c")
    long sumTotalUnreadMessages();
}
