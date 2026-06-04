package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {

    /**
     * Lấy tin nhắn theo conversationId, sắp xếp cũ → mới, có phân trang.
     * Dùng cho REST API load history.
     */
    Page<Message> findByConversationIdOrderByCreatedAtAsc(String conversationId, Pageable pageable);

    /** Đếm số tin nhắn — dùng trong ConversationSummary */
    long countByConversationId(String conversationId);

    /** Lấy tin nhắn cuối — dùng trong waiting list */
    Message findTopByConversationIdOrderByCreatedAtDesc(String conversationId);
}
