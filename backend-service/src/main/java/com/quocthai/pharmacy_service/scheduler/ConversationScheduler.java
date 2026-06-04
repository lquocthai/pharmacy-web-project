package com.quocthai.pharmacy_service.scheduler;

import com.quocthai.pharmacy_service.entity.Conversation;
import com.quocthai.pharmacy_service.repository.ConversationRepository;
import com.quocthai.pharmacy_service.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduler tự động CLOSE conversation đã RESOLVED
 * và không có tin nhắn mới trong 7 ngày.
 *
 * Chạy mỗi ngày lúc 02:00 AM để tránh giờ cao điểm.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ConversationScheduler {

    private final ConversationRepository conversationRepository;
    private final ChatService chatService;

    private static final int INACTIVE_DAYS = 7;

    /**
     * cron = "0 0 2 * * *" → chạy lúc 02:00:00 mỗi ngày.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void autoCloseInactiveConversations() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(INACTIVE_DAYS);

        List<Conversation> toClose =
                conversationRepository.findResolvedInactiveSince(threshold);

        if (toClose.isEmpty()) {
            log.debug("Scheduler: no conversations to auto-close");
            return;
        }

        toClose.forEach(conv -> {
            conv.setStatus(Conversation.ConversationStatus.CLOSED);
            log.info("Auto-closing conversation {} (last activity: {})",
                    conv.getId(), conv.getLastMessageAt());
        });

        // Gom saveAll — không save trong vòng lặp
        conversationRepository.saveAll(toClose);

        // Broadcast realtime cho mỗi conversation vừa closed
        toClose.forEach(conv ->
                chatService.broadcastConversationUpdate(conv)
        );

        log.info("Scheduler: auto-closed {} conversations", toClose.size());
    }
}
