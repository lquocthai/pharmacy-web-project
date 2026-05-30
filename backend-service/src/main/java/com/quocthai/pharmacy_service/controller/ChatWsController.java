package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.dto.request.ChatMessageRequest;
import com.quocthai.pharmacy_service.entity.Message;
import com.quocthai.pharmacy_service.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatWsController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void send(ChatMessageRequest req) {

        Message saved = chatService.save(req);

        messagingTemplate.convertAndSend(
                "/topic/chat." + req.getConversationId(),
                saved
        );
    }
}
