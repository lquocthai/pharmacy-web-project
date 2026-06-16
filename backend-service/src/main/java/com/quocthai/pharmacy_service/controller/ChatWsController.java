package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.dto.request.SendMessageRequest;
import com.quocthai.pharmacy_service.dto.response.MessageResponse;
import com.quocthai.pharmacy_service.dto.response.WsErrorResponse;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * WebSocket / STOMP controller — Messenger/Zalo style Shared Inbox.
 *
 * Client destinations (gửi đến /app/...):
 *   /app/chat.send         — gửi tin nhắn (tự động tạo conversation nếu chưa có)
 *   /app/chat.read         — đánh dấu đã đọc (reset unreadCount)
 *
 * Server topics (client subscribe):
 *   /topic/conversation/{id}   — chat room realtime
 *   /topic/conversations        — shared inbox update (dược sĩ)
 *   /user/queue/errors          — lỗi cá nhân
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWsController {

    private final ChatService chatService;

    /**
     * Gửi tin nhắn.
     *
     * Flow USER:
     *   - Nếu chưa có conversation → tự động tạo mới + bot chào
     *   - Broadcast tới /topic/conversation/{id}
     *   - Broadcast conversation update tới /topic/conversations (shared inbox)
     *   - unreadCount++
     *
     * Flow PHARMACIST / ADMIN:
     *   - Cần conversationId trong payload
     *   - Broadcast tương tự
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload SendMessageRequest req, Principal principal) {
        MessageResponse result = chatService.sendMessage(req, principal);
        log.debug("Message sent: conv={} by={}", result.getConversationId(), principal.getName());
    }

    /**
     * Dược sĩ mở conversation → đánh dấu đã đọc, reset unreadCount.
     * Client gửi: SEND destination:/app/chat.read
     * Payload: conversationId (plain string)
     */
    @MessageMapping("/chat.read")
    public void markAsRead(@Payload String conversationId, Principal principal) {
        chatService.markAsRead(conversationId.trim());
        log.debug("Conversation {} marked as read by {}", conversationId.trim(), principal.getName());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Error handling — gửi lỗi riêng về client gây ra lỗi
    // Client subscribe: /user/queue/errors
    // ─────────────────────────────────────────────────────────────────────────

    @MessageExceptionHandler(AppException.class)
    @SendToUser("/queue/errors")
    public WsErrorResponse handleAppException(AppException ex) {
        log.warn("WS AppException: code={} msg={}", ex.getErrorCode().getCode(), ex.getMessage());
        return WsErrorResponse.builder()
                .code(ex.getErrorCode().getCode())
                .message(ex.getErrorCode().getMessage())
                .build();
    }

    @MessageExceptionHandler(Exception.class)
    @SendToUser("/queue/errors")
    public WsErrorResponse handleGenericException(Exception ex) {
        log.error("WS unhandled exception: ", ex);
        return WsErrorResponse.builder()
                .code(9999)
                .message("Đã xảy ra lỗi, vui lòng thử lại")
                .build();
    }
}
