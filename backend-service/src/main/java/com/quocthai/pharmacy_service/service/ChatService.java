package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.constants.PredefinedRole;
import com.quocthai.pharmacy_service.dto.request.SendMessageRequest;
import com.quocthai.pharmacy_service.dto.response.ConversationResponse;
import com.quocthai.pharmacy_service.dto.response.MessageResponse;
import com.quocthai.pharmacy_service.entity.Conversation;
import com.quocthai.pharmacy_service.entity.Message;
import com.quocthai.pharmacy_service.entity.User;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.repository.ConversationRepository;
import com.quocthai.pharmacy_service.repository.MessageRepository;
import com.quocthai.pharmacy_service.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.time.LocalDateTime;

/**
 * Core chat service — Messenger/Zalo style Shared Inbox.
 *
 * Không còn status flow. Không còn claim/resolve/close.
 * Bất kỳ dược sĩ nào cũng có thể mở và trả lời bất kỳ conversation nào.
 *
 * Flow gửi tin nhắn:
 *   USER gửi → tự động tạo conversation nếu chưa có → broadcast tới /topic/conversation/{id}
 *              → broadcast conversation update tới /topic/conversations (dược sĩ shared inbox)
 *              → unreadCount++
 *   PHARMACIST gửi → tìm conversation theo id → broadcast tới /topic/conversation/{id}
 *                  → broadcast conversation update tới /topic/conversations
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatService {

    ConversationRepository conversationRepository;
    MessageRepository messageRepository;
    UserRepository userRepository;
    SimpMessagingTemplate messagingTemplate;

    private static final String BOT_SENDER_ID    = "SYSTEM_BOT";
    private static final String BOT_DISPLAY_NAME = "Bot Nhà Thuốc";
    private static final String BOT_WELCOME      =
            "Nhà thuốc Quốc Thái xin chào! Dược sĩ sẽ hỗ trợ bạn sớm nhất có thể. Bạn cần tư vấn về vấn đề gì ạ?";

    // ─────────────────────────────────────────────────────────────────────────
    // GỬI TIN NHẮN (WebSocket entry point)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public MessageResponse sendMessage(SendMessageRequest req, Principal principal) {
        User sender = resolveUser(principal.getName());
        String role = detectPrimaryRole(sender);

        return switch (role) {
            case PredefinedRole.USER_ROLE       -> handleUserMessage(req, sender);
            case PredefinedRole.PHARMACIST_ROLE -> handlePharmacistMessage(req, sender);
            case PredefinedRole.ADMIN_ROLE      -> handlePharmacistMessage(req, sender); // Admin cũng chat được
            default -> throw new AppException(ErrorCode.UNAUTHORIZED);
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // USER MESSAGE
    // ─────────────────────────────────────────────────────────────────────────

    private MessageResponse handleUserMessage(SendMessageRequest req, User user) {
        Conversation conv = getOrCreateConversation(user, req.getConversationId());

        // Lưu message
        Message msg = buildMessage(req, user, conv.getId(), Message.SenderRole.USER);
        messageRepository.save(msg);

        // Cập nhật conversation: lastMessageAt + tăng unreadCount
        conv.setLastMessageAt(LocalDateTime.now());
        conv.setUnreadCount(conv.getUnreadCount() + 1);
        conversationRepository.save(conv);

        MessageResponse resp = toMessageResponse(msg);

        // Broadcast tới chat room
        broadcastMessage(conv.getId(), resp);

        // Broadcast conversation update tới shared inbox của dược sĩ
        broadcastConversationUpdate(conv, msg);

        return resp;
    }

    /**
     * Lấy conversation hiện có hoặc tạo mới cho user.
     * Mỗi user chỉ có 1 conversation duy nhất (không phân biệt session).
     */
    private Conversation getOrCreateConversation(User user, String requestedConvId) {
        // Nếu client chỉ định conversationId → dùng conversation đó
        if (requestedConvId != null && !requestedConvId.isBlank()) {
            Conversation conv = conversationRepository.findById(requestedConvId)
                    .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
            if (!conv.getUserId().equals(user.getId())) {
                throw new AppException(ErrorCode.NOT_YOUR_CONVERSATION);
            }
            return conv;
        }

        // Tìm conversation hiện có của user
        return conversationRepository.findByUserId(user.getId())
                .orElseGet(() -> createNewConversation(user));
    }

    private Conversation createNewConversation(User user) {
        Conversation conv = Conversation.builder()
                .userId(user.getId())
                .userDisplayName(user.getUsername())
                .unreadCount(0)
                .build();
        conversationRepository.save(conv);

        // Gửi tin chào từ bot
        Message botMsg = buildBotMessage(conv.getId());
        messageRepository.save(botMsg);
        broadcastMessage(conv.getId(), toMessageResponse(botMsg));

        log.info("New conversation {} created for user {}", conv.getId(), user.getId());
        return conv;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PHARMACIST / ADMIN MESSAGE
    // ─────────────────────────────────────────────────────────────────────────

    private MessageResponse handlePharmacistMessage(SendMessageRequest req, User pharmacist) {
        if (req.getConversationId() == null || req.getConversationId().isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Conversation conv = conversationRepository.findById(req.getConversationId())
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        // Xác định role gửi tin
        Message.SenderRole senderRole = hasRole(pharmacist, PredefinedRole.PHARMACIST_ROLE)
                ? Message.SenderRole.PHARMACIST
                : Message.SenderRole.ADMIN;

        Message msg = buildMessage(req, pharmacist, conv.getId(), senderRole);
        messageRepository.save(msg);

        // Cập nhật lastMessageAt, không tăng unreadCount (dược sĩ là người trả lời)
        conv.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conv);

        MessageResponse resp = toMessageResponse(msg);
        broadcastMessage(conv.getId(), resp);
        broadcastConversationUpdate(conv, msg);

        return resp;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MARK AS READ — dược sĩ mở conversation
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public void markAsRead(String conversationId) {
        conversationRepository.resetUnreadCount(conversationId);
        // Broadcast cập nhật unread về 0 cho tất cả dược sĩ đang online
        conversationRepository.findById(conversationId).ifPresent(conv -> {
            conv.setUnreadCount(0);
            broadcastConversationUpdate(conv, null);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BROADCAST helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Gửi tin nhắn vào room của conversation.
     * Tất cả subscriber của /topic/conversation/{id} đều nhận.
     */
    public void broadcastMessage(String conversationId, MessageResponse msg) {
        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, msg);
    }

    /**
     * Broadcast cập nhật conversation ra shared inbox topic.
     * Tất cả dược sĩ subscribe /topic/conversations đều nhận và cập nhật danh sách.
     * Conversation sẽ nổi lên đầu danh sách (sort by lastMessageAt DESC ở frontend).
     */
    public void broadcastConversationUpdate(Conversation conv, Message lastMsg) {
        ConversationResponse resp = toConversationResponse(conv);
        if (lastMsg != null) {
            resp.setLastMessageContent(lastMsg.getContent());
            resp.setLastMessageSenderRole(lastMsg.getSenderRole() != null ? lastMsg.getSenderRole().name() : null);
        }
        messagingTemplate.convertAndSend("/topic/conversations", resp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Mapping helpers — public để ConversationService dùng
    // ─────────────────────────────────────────────────────────────────────────

    public MessageResponse toMessageResponse(Message m) {
        return MessageResponse.builder()
                .id(m.getId())
                .conversationId(m.getConversationId())
                .senderId(m.getSenderId())
                .senderDisplayName(m.getSenderDisplayName())
                .senderRole(m.getSenderRole())
                .messageType(m.getMessageType())
                .content(m.getContent())
                .fileUrl(m.getFileUrl())
                .fileName(m.getFileName())
                .createdAt(m.getCreatedAt())
                .build();
    }

    public ConversationResponse toConversationResponse(Conversation c) {
        return ConversationResponse.builder()
                .id(c.getId())
                .userId(c.getUserId())
                .userDisplayName(c.getUserDisplayName())
                .userAvatarUrl(c.getUserAvatarUrl())
                .lastMessageAt(c.getLastMessageAt())
                .createdAt(c.getCreatedAt())
                .unreadCount(c.getUnreadCount())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private String detectPrimaryRole(User user) {
        // Priority: PHARMACIST > ADMIN > USER
        return user.getRoles().stream()
                .map(r -> r.getName())
                .max(java.util.Comparator.comparingInt(n -> {
                    if (n.equals(PredefinedRole.PHARMACIST_ROLE)) return 3;
                    if (n.equals(PredefinedRole.ADMIN_ROLE)) return 2;
                    return 1;
                }))
                .orElse(PredefinedRole.USER_ROLE);
    }

    private boolean hasRole(User user, String roleName) {
        return user.getRoles().stream().anyMatch(r -> r.getName().equals(roleName));
    }

    private Message buildMessage(SendMessageRequest req, User sender,
                                  String conversationId, Message.SenderRole role) {
        return Message.builder()
                .conversationId(conversationId)
                .senderId(sender.getId())
                .senderDisplayName(sender.getUsername())
                .senderRole(role)
                .messageType(req.getMessageType() != null ? req.getMessageType() : Message.MessageType.TEXT)
                .content(req.getContent())
                .fileUrl(req.getFileUrl())
                .fileName(req.getFileName())
                .build();
    }

    private Message buildBotMessage(String conversationId) {
        return Message.builder()
                .conversationId(conversationId)
                .senderId(BOT_SENDER_ID)
                .senderDisplayName(BOT_DISPLAY_NAME)
                .senderRole(Message.SenderRole.BOT)
                .messageType(Message.MessageType.TEXT)
                .content(BOT_WELCOME)
                .build();
    }
}
