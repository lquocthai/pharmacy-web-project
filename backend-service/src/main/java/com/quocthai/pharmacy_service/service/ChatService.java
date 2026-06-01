package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.dto.request.ChatMessageRequest;
import com.quocthai.pharmacy_service.dto.response.MessageResponse;
import com.quocthai.pharmacy_service.entity.Conversation;
import com.quocthai.pharmacy_service.entity.Message;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.repository.ConversationRepository;
import com.quocthai.pharmacy_service.repository.MessageRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatService {

    MessageRepository messageRepository;
    ConversationRepository conversationRepository;
    BotService botService;

    public ChatService(MessageRepository messageRepository,
                       ConversationRepository conversationRepository,
                       @Lazy BotService botService) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.botService = botService;
    }

    /**
     * Lưu tin nhắn từ WebSocket.
     * - Nếu conversation đang RESOLVED và user gửi tin → tự động set lại PENDING.
     * - Không cho gửi vào conversation CLOSED.
     */
    @Transactional
    public MessageResponse save(ChatMessageRequest req) {

        Conversation c = conversationRepository.findById(req.getConversationId())
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        // Không cho gửi vào conversation đã CLOSED
        if (c.getStatus() == Conversation.ConversationStatus.CLOSED) {
            throw new AppException(ErrorCode.CONVERSATION_CLOSED);
        }

        // Nếu user nhắn lại sau khi RESOLVED → set về PENDING để dược sĩ nhận lại
        boolean isUserMessage = req.getSenderRole() == Message.SenderRole.USER;
        if (isUserMessage && c.getStatus() == Conversation.ConversationStatus.RESOLVED) {
            c.setStatus(Conversation.ConversationStatus.PENDING);
            c.setPharmacistId(null);
            log.info("Conversation {} re-opened to PENDING by user", c.getId());
        }

        Message msg = Message.builder()
                .conversationId(req.getConversationId())
                .senderId(req.getSenderId())
                .senderRole(req.getSenderRole())
                .messageType(req.getMessageType() != null ? req.getMessageType() : Message.MessageType.TEXT)
                .content(req.getContent())
                .fileUrl(req.getFileUrl())
                .fileName(req.getFileName())
                .createdAt(LocalDateTime.now())
                .build();

        messageRepository.save(msg);

        c.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(c);

        // Nếu đây là tin nhắn đầu tiên của user (conversation vừa tạo) → bot trả lời
        long messageCount = messageRepository.countByConversationId(req.getConversationId());
        if (messageCount == 1 && isUserMessage) {
            botService.sendWelcome(req.getConversationId());
        }

        return toResponse(msg, req.getSenderName());
    }

    /**
     * Lấy lịch sử tin nhắn của một conversation.
     */
    public List<MessageResponse> getMessages(String conversationId) {
        conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(m -> toResponse(m, null))
                .collect(Collectors.toList());
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    public static MessageResponse toResponse(Message m, String senderName) {
        return MessageResponse.builder()
                .id(m.getId())
                .conversationId(m.getConversationId())
                .senderId(m.getSenderId())
                .senderName(senderName)
                .senderRole(m.getSenderRole())
                .messageType(m.getMessageType())
                .content(m.getContent())
                .fileUrl(m.getFileUrl())
                .fileName(m.getFileName())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
