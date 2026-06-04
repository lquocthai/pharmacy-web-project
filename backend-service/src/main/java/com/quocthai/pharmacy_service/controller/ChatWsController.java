package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.dto.request.SendMessageRequest;
import com.quocthai.pharmacy_service.dto.response.ConversationResponse;
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
 * WebSocket / STOMP controller.
 *
 * Destinations (client gửi đến /app/...):
 *   /app/chat.send                — gửi tin nhắn
 *   /app/conversation.close       — user chủ động đóng conversation
 *
 * Principal.getName() = email (set bởi JwtChannelInterceptor).
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWsController {

    private final ChatService chatService;

    /**
     * Client gửi: SEND destination:/app/chat.send
     *
     * Flow:
     *   1. Phân quyền theo role trong Principal
     *   2. Auto-tạo conversation nếu cần (USER)
     *   3. Lưu message
     *   4. Broadcast tới /topic/conversation/{id}
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload SendMessageRequest req, Principal principal) {
        MessageResponse result = chatService.sendMessage(req, principal);
        log.debug("Message sent: conv={} by={}", result.getConversationId(), principal.getName());
    }

    /**
     * User chủ động kết thúc tư vấn.
     * Client gửi: SEND destination:/app/conversation.close
     * Payload: conversationId (plain string)
     */
    @MessageMapping("/conversation.close")
    public void closeConversation(@Payload String conversationId, Principal principal) {
        ConversationResponse result = chatService.closeConversation(conversationId.trim(), principal);
        log.debug("Conversation {} closed by {}", result.getId(), principal.getName());
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
