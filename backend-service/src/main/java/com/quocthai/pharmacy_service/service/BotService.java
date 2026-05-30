package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.entity.Message;
import com.quocthai.pharmacy_service.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class BotService {

    private final MessageRepository messageRepository;

    public void sendWelcome(String conversationId) {

        Message bot = new Message();
        bot.setConversationId(conversationId);
        bot.setSenderRole(Message.SenderRole.BOT);
        bot.setMessageType(Message.MessageType.TEXT);
        bot.setContent("Xin chờ dược sĩ tư vấn trong giây lát...");
        bot.setCreatedAt(LocalDateTime.now());

        messageRepository.save(bot);
    }
}
