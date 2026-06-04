package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.constants.PredefinedRole;
import com.quocthai.pharmacy_service.dto.response.ConversationResponse;
import com.quocthai.pharmacy_service.dto.response.MessageResponse;
import com.quocthai.pharmacy_service.dto.response.PageResponse;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST-facing service: đọc danh sách conversation, đọc lịch sử message.
 * Không chứa logic send/claim/resolve — thuộc ChatService.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ConversationService {

    ConversationRepository conversationRepository;
    MessageRepository messageRepository;
    UserRepository userRepository;
    ChatService chatService;

    // ─────────────────────────────────────────────────────────────────────────
    // USER: lịch sử conversation của chính mình
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<ConversationResponse> getMyConversations(int page, int size) {
        String email = currentEmail();
        User user = resolveUser(email);

        Pageable pageable = PageRequest.of(page, size);
        Page<Conversation> result = conversationRepository
                .findByUserIdOrderByLastMessageAtDesc(user.getId(), pageable);

        return toPageResponse(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PHARMACIST: waiting list (PENDING) + own IN_PROGRESS
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<ConversationResponse> getWaitingConversations(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Conversation> result = conversationRepository
                .findByStatusOrderByLastMessageAtDesc(Conversation.ConversationStatus.PENDING, pageable);
        return toPageResponseWithSummary(result);
    }

    @Transactional(readOnly = true)
    public PageResponse<ConversationResponse> getConversationsByStatus(
            Conversation.ConversationStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Conversation> result = conversationRepository
                .findByStatusOrderByLastMessageAtDesc(status, pageable);
        return toPageResponseWithSummary(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN: tất cả conversation
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<ConversationResponse> getAllConversations(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Conversation> result = conversationRepository
                .findAllByOrderByLastMessageAtDesc(pageable);
        return toPageResponse(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MESSAGE HISTORY (user & pharmacist & admin)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<MessageResponse> getMessages(String conversationId, int page, int size) {
        // Ownership/access check
        String email = currentEmail();
        User caller = resolveUser(email);

        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        boolean isAdmin = hasRole(caller, PredefinedRole.ADMIN_ROLE);
        boolean isPharmacist = hasRole(caller, PredefinedRole.PHARMACIST_ROLE);
        boolean isOwner = conv.getUserId().equals(caller.getId());
        boolean isAssignedPharmacist = caller.getId().equals(conv.getPharmacistId());

        if (!isAdmin && !isPharmacist && !isOwner) {
            throw new AppException(ErrorCode.NOT_YOUR_CONVERSATION);
        }

        // Pharmacist chỉ đọc được conversation của họ hoặc conversation PENDING/IN_PROGRESS
        if (isPharmacist && !isAdmin && !isOwner && !isAssignedPharmacist
                && conv.getStatus() != Conversation.ConversationStatus.PENDING) {
            throw new AppException(ErrorCode.CONVERSATION_FORBIDDEN);
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<Message> msgs = messageRepository
                .findByConversationIdOrderByCreatedAtAsc(conversationId, pageable);

        return PageResponse.<MessageResponse>builder()
                .content(msgs.getContent().stream()
                        .map(chatService::toMessageResponse)
                        .collect(Collectors.toList()))
                .page(msgs.getNumber())
                .size(msgs.getSize())
                .totalElements(msgs.getTotalElements())
                .totalPages(msgs.getTotalPages())
                .last(msgs.isLast())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private String currentEmail() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) throw new AppException(ErrorCode.UNAUTHENTICATED);
        return auth.getName();
    }

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private boolean hasRole(User user, String roleName) {
        return user.getRoles().stream().anyMatch(r -> r.getName().equals(roleName));
    }

    private PageResponse<ConversationResponse> toPageResponse(Page<Conversation> page) {
        List<ConversationResponse> content = page.getContent().stream()
                .map(chatService::toConversationResponse)
                .collect(Collectors.toList());
        return buildPageResponse(page, content);
    }

    /** Thêm summary (count + lastMessage) cho waiting-list — tránh N+1 bằng cách load riêng */
    private PageResponse<ConversationResponse> toPageResponseWithSummary(Page<Conversation> page) {
        List<ConversationResponse> content = page.getContent().stream()
                .map(c -> {
                    ConversationResponse resp = chatService.toConversationResponse(c);
                    resp.setMessageCount(messageRepository.countByConversationId(c.getId()));
                    Message last = messageRepository.findTopByConversationIdOrderByCreatedAtDesc(c.getId());
                    if (last != null) {
                        resp.setLastMessageContent(last.getContent());
                        resp.setLastMessageSenderRole(last.getSenderRole() != null
                                ? last.getSenderRole().name() : null);
                    }
                    return resp;
                })
                .collect(Collectors.toList());
        return buildPageResponse(page, content);
    }

    private <T> PageResponse<T> buildPageResponse(Page<?> page, List<T> content) {
        return PageResponse.<T>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
