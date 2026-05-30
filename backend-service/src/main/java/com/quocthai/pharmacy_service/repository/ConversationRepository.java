package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ConversationRepository
        extends JpaRepository<Conversation, String> {

    List<Conversation> findByStatus(Conversation.ConversationStatus status);

    @Query("""
        SELECT c FROM Conversation c
        WHERE c.status = 'IN_PROGRESS'
        AND c.lastMessageAt < :time
    """)
    List<Conversation> findInactive(@Param("time") LocalDateTime time);

}