package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.dto.request.ChatMessageRequest;
import com.quocthai.pharmacy_service.entity.Conversation;
import com.quocthai.pharmacy_service.entity.Message;
import com.quocthai.pharmacy_service.repository.ConversationRepository;
import com.quocthai.pharmacy_service.repository.MessageRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;

    public Message save(ChatMessageRequest req) {

        Message msg = new Message();

        msg.setConversationId(req.getConversationId());
        msg.setSenderId(req.getSenderId());
        msg.setSenderRole(req.getSenderRole());
        msg.setMessageType(req.getMessageType());
        msg.setContent(req.getContent());
        msg.setFileUrl(req.getFileUrl());
        msg.setFileName(req.getFileName());
        msg.setCreatedAt(LocalDateTime.now());

        messageRepository.save(msg);

        Conversation c = conversationRepository.findById(req.getConversationId())
                .orElseThrow();

        c.setLastMessageAt(LocalDateTime.now());

        conversationRepository.save(c);

        return msg;
    }
}
