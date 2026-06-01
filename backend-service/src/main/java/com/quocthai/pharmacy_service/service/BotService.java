package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.dto.response.MessageResponse;
import com.quocthai.pharmacy_service.entity.Message;
import com.quocthai.pharmacy_service.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class BotService {

    private static final String BOT_SENDER_ID = "BOT";
    private static final String BOT_WELCOME_MSG = "Xin chào! Bạn đang kết nối với hệ thống tư vấn dược. " +
            "Vui lòng chờ dược sĩ tham gia tư vấn trong giây lát...";

    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Gửi tin nhắn chào mừng khi user nhắn tin đầu tiên.
     * Lưu vào DB và broadcast qua WebSocket.
     */
    public void sendWelcome(String conversationId) {

        Message bot = Message.builder()
                .conversationId(conversationId)
                .senderId(BOT_SENDER_ID)
                .senderRole(Message.SenderRole.BOT)
                .messageType(Message.MessageType.TEXT)
                .content(BOT_WELCOME_MSG)
                .createdAt(LocalDateTime.now())
                .build();

        messageRepository.save(bot);

        // Broadcast bot message qua WebSocket để client nhận ngay
        MessageResponse response = ChatService.toResponse(bot, "Bot");
        messagingTemplate.convertAndSend("/topic/chat." + conversationId, response);
    }
}
