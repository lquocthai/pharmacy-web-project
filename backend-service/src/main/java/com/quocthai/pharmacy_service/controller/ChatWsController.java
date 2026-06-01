package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.dto.request.ChatMessageRequest;
import com.quocthai.pharmacy_service.dto.response.MessageResponse;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWsController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Client gửi tới: /app/chat.send
     * Server broadcast tới: /topic/chat.{conversationId}
     */
    @MessageMapping("/chat.send")
    public void send(ChatMessageRequest req, Principal principal) {
        log.info("WS message received: {}", req);

        // Nếu senderId không được truyền, lấy từ principal (JWT subject)
        if (req.getSenderId() == null && principal != null) {
            req.setSenderId(principal.getName());
        }

        MessageResponse saved = chatService.save(req);
        log.info("WS message saved: {}", saved.getId());
        messagingTemplate.convertAndSend(
                "/topic/chat." + req.getConversationId(),
                saved
        );
    }

    /**
     * Bắt lỗi từ WebSocket handler và gửi về cho user gây lỗi.
     * Client subscribe: /user/queue/errors
     */
    @MessageExceptionHandler
    @SendToUser("/queue/errors")
    public String handleException(AppException ex) {
        log.warn("WebSocket AppException: {}", ex.getMessage());
        return ex.getErrorCode().getMessage();
    }

    @MessageExceptionHandler(Exception.class)
    @SendToUser("/queue/errors")
    public String handleGenericException(Exception ex) {
        log.error("WebSocket unhandled exception: ", ex);
        return "Đã xảy ra lỗi, vui lòng thử lại";
    }
}
