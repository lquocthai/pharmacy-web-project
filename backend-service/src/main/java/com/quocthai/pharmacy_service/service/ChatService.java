package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.constants.PredefinedRole;
import com.quocthai.pharmacy_service.dto.request.SendMessageRequest;
import com.quocthai.pharmacy_service.dto.response.ConversationResponse;
import com.quocthai.pharmacy_service.dto.response.MessageResponse;
import com.quocthai.pharmacy_service.entity.Conversation;
import com.quocthai.pharmacy_service.entity.Conversation.ConversationStatus;
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
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Core chat service — xử lý gửi tin, auto-tạo conversation, status transitions.
 *
 * Convention: mọi phương thức cần email user lấy từ Principal.getName()
 * rồi resolve sang User để lấy userId (UUID).
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

    private static final String BOT_SENDER_ID = "SYSTEM_BOT";
    private static final String BOT_DISPLAY_NAME = "Bot Nhà Thuốc";
    private static final String BOT_WELCOME = "Nhà thuốc xin chào. Em có thể hỗ trợ thông tin gì cho Quý khách ạ?";

    // ─────────────────────────────────────────────────────────────────────────
    // GỬI TIN NHẮN (WebSocket entry point)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Điểm vào duy nhất cho mọi loại gửi tin.
     * Logic role sẽ phân nhánh bên trong.
     */
    @Transactional
    public MessageResponse sendMessage(SendMessageRequest req, Principal principal) {
        User sender = resolveUser(principal.getName());
        String role = detectRole(sender);

        return switch (role) {
            case PredefinedRole.USER_ROLE       -> handleUserMessage(req, sender);
            case PredefinedRole.PHARMACIST_ROLE -> handlePharmacistMessage(req, sender);
            default -> throw new AppException(ErrorCode.UNAUTHORIZED);
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // USER MESSAGE
    // ─────────────────────────────────────────────────────────────────────────

    private MessageResponse handleUserMessage(SendMessageRequest req, User user) {
        Conversation conv;

        if (req.getConversationId() != null && !req.getConversationId().isBlank()) {
            // Tin nhắn vào conversation đã có
            conv = conversationRepository.findById(req.getConversationId())
                    .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

            // Ownership check
            if (!conv.getUserId().equals(user.getId())) {
                throw new AppException(ErrorCode.NOT_YOUR_CONVERSATION);
            }

            if (conv.getStatus() == ConversationStatus.CLOSED) {
                throw new AppException(ErrorCode.CONVERSATION_CLOSED);
            }

            // User nhắn lại sau RESOLVED → reset về PENDING
            if (conv.getStatus() == ConversationStatus.RESOLVED) {
                conv.setStatus(ConversationStatus.PENDING);
                conv.setPharmacistId(null);
                conversationRepository.save(conv);
                // Notify waiting list đã có conversation mới cần nhận
                broadcastConversationUpdate(conv);
                log.info("Conversation {} re-opened to PENDING by user {}", conv.getId(), user.getId());
            }

        } else {
            // Kiểm tra đã có conversation OPEN chưa
            List<Conversation> open = conversationRepository.findOpenByUserId(user.getId());
            if (!open.isEmpty()) {
                conv = open.get(0);
            } else {
                // Tạo conversation mới
                conv = Conversation.builder()
                        .userId(user.getId())
                        .userDisplayName(user.getUsername())
                        .status(ConversationStatus.PENDING)
                        .build();
                conversationRepository.save(conv);

                // Bot chào
                Message botMsg = buildBotMessage(conv.getId());
                messageRepository.save(botMsg);
                broadcastMessage(conv.getId(), toMessageResponse(botMsg));

                // Notify dược sĩ có conversation mới
                broadcastConversationUpdate(conv);

                log.info("New conversation {} created for user {}", conv.getId(), user.getId());
            }
        }

        Message msg = buildMessage(req, user, conv.getId(), Message.SenderRole.USER);
        messageRepository.save(msg);

        conv.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conv);

        MessageResponse resp = toMessageResponse(msg);
        broadcastMessage(conv.getId(), resp);
        return resp;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PHARMACIST MESSAGE
    // ─────────────────────────────────────────────────────────────────────────

    private MessageResponse handlePharmacistMessage(SendMessageRequest req, User pharmacist) {
        if (req.getConversationId() == null || req.getConversationId().isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Conversation conv = conversationRepository.findById(req.getConversationId())
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        if (conv.getStatus() != ConversationStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.CONVERSATION_NOT_IN_PROGRESS);
        }

        // Chỉ dược sĩ đã claim mới được gửi
        if (!pharmacist.getId().equals(conv.getPharmacistId())) {
            throw new AppException(ErrorCode.PHARMACIST_NOT_ASSIGNED);
        }

        Message msg = buildMessage(req, pharmacist, conv.getId(), Message.SenderRole.PHARMACIST);
        messageRepository.save(msg);

        conv.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conv);

        MessageResponse resp = toMessageResponse(msg);
        broadcastMessage(conv.getId(), resp);
        return resp;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CLAIM — dược sĩ nhận tư vấn
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public ConversationResponse claimConversation(String conversationId, Principal principal) {
        User pharmacist = resolveUser(principal.getName());
        requireRole(pharmacist, PredefinedRole.PHARMACIST_ROLE);

        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        if (conv.getStatus() != ConversationStatus.PENDING) {
            throw new AppException(ErrorCode.CONVERSATION_ALREADY_TAKEN);
        }

        conv.setStatus(ConversationStatus.IN_PROGRESS);
        conv.setPharmacistId(pharmacist.getId());

        try {
            conversationRepository.saveAndFlush(conv); // flush để optimistic lock phát huy
        } catch (OptimisticLockingFailureException ex) {
            throw new AppException(ErrorCode.CONVERSATION_ALREADY_TAKEN);
        }

        // Notify cả 2 phía
        broadcastConversationUpdate(conv);
        log.info("Conversation {} claimed by pharmacist {}", conversationId, pharmacist.getId());

        return toConversationResponse(conv);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESOLVE — dược sĩ kết thúc tư vấn
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public ConversationResponse resolveConversation(String conversationId, Principal principal) {
        User pharmacist = resolveUser(principal.getName());
        requireRole(pharmacist, PredefinedRole.PHARMACIST_ROLE);

        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        if (conv.getStatus() != ConversationStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.CONVERSATION_NOT_IN_PROGRESS);
        }

        if (!pharmacist.getId().equals(conv.getPharmacistId())) {
            throw new AppException(ErrorCode.PHARMACIST_NOT_ASSIGNED);
        }

        conv.setStatus(ConversationStatus.RESOLVED);
        conversationRepository.save(conv);

        broadcastConversationUpdate(conv);
        log.info("Conversation {} resolved by pharmacist {}", conversationId, pharmacist.getId());

        return toConversationResponse(conv);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CLOSE — user chủ động kết thúc
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public ConversationResponse closeConversation(String conversationId, Principal principal) {
        User user = resolveUser(principal.getName());

        Conversation conv = conversationRepository.findByIdAndUserId(conversationId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_YOUR_CONVERSATION));

        if (conv.getStatus() == ConversationStatus.CLOSED) {
            return toConversationResponse(conv); // idempotent
        }

        conv.setStatus(ConversationStatus.CLOSED);
        conversationRepository.save(conv);

        broadcastConversationUpdate(conv);
        log.info("Conversation {} closed by user {}", conversationId, user.getId());

        return toConversationResponse(conv);
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
     * Broadcast cập nhật conversation ra waiting-list topic.
     * Dược sĩ subscribe /topic/conversations để thấy hàng chờ cập nhật realtime.
     */
    public void broadcastConversationUpdate(Conversation conv) {
        messagingTemplate.convertAndSend("/topic/conversations", toConversationResponse(conv));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Mapping helpers
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
                .pharmacistId(c.getPharmacistId())
                .status(c.getStatus())
                .lastMessageAt(c.getLastMessageAt())
                .createdAt(c.getCreatedAt())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private String detectRole(User user) {
        return user.getRoles().stream()
                .map(r -> r.getName())
                .filter(n -> n.equals(PredefinedRole.PHARMACIST_ROLE)
                          || n.equals(PredefinedRole.ADMIN_ROLE)
                          || n.equals(PredefinedRole.USER_ROLE))
                // priority: PHARMACIST > ADMIN > USER
                .max(java.util.Comparator.comparingInt(n -> {
                    if (n.equals(PredefinedRole.PHARMACIST_ROLE)) return 3;
                    if (n.equals(PredefinedRole.ADMIN_ROLE)) return 2;
                    return 1;
                }))
                .orElse(PredefinedRole.USER_ROLE);
    }

    private void requireRole(User user, String requiredRole) {
        boolean hasRole = user.getRoles().stream()
                .anyMatch(r -> r.getName().equals(requiredRole));
        if (!hasRole) throw new AppException(ErrorCode.UNAUTHORIZED);
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
