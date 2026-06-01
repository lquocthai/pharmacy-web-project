package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.dto.request.CreateConversationRequest;
import com.quocthai.pharmacy_service.dto.response.ConversationResponse;
import com.quocthai.pharmacy_service.entity.Conversation;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.repository.ConversationRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ConversationService {

    ConversationRepository conversationRepository;

    /**
     * User tạo cuộc hội thoại mới → trạng thái PENDING.
     */
    @Transactional
    public ConversationResponse create(String userId, CreateConversationRequest req) {
        Conversation c = Conversation.builder()
                .userId(userId)
                .status(Conversation.ConversationStatus.PENDING)
                .build();

        conversationRepository.save(c);
        log.info("Conversation {} created by user {}", c.getId(), userId);
        return toResponse(c);
    }

    /**
     * Dược sĩ / Admin lấy danh sách hội thoại theo trạng thái.
     * Mặc định trả về PENDING nếu không truyền status.
     */
    public List<ConversationResponse> list(Conversation.ConversationStatus status) {
        Conversation.ConversationStatus filter =
                status != null ? status : Conversation.ConversationStatus.PENDING;
        return conversationRepository.findByStatusOrderByLastMessageAtDesc(filter)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Dược sĩ nhận tư vấn (claim).
     * Dùng optimistic lock — nếu hai dược sĩ claim cùng lúc, người sau nhận ALREADY_TAKEN.
     */
    @Transactional
    public ConversationResponse claim(String conversationId, String pharmacistId) {
        Conversation c = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        if (c.getStatus() != Conversation.ConversationStatus.PENDING) {
            throw new AppException(ErrorCode.CONVERSATION_ALREADY_TAKEN);
        }

        c.setStatus(Conversation.ConversationStatus.IN_PROGRESS);
        c.setPharmacistId(pharmacistId);
        c.setUpdatedAt(LocalDateTime.now());

        try {
            conversationRepository.saveAndFlush(c);
        } catch (OptimisticLockingFailureException e) {
            // Dược sĩ khác vừa claim trước
            throw new AppException(ErrorCode.CONVERSATION_ALREADY_TAKEN);
        }

        log.info("Conversation {} claimed by pharmacist {}", conversationId, pharmacistId);
        return toResponse(c);
    }

    /**
     * Dược sĩ / Admin đánh dấu tư vấn hoàn tất → RESOLVED.
     */
    @Transactional
    public ConversationResponse resolve(String conversationId, String pharmacistId) {
        Conversation c = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        if (c.getStatus() != Conversation.ConversationStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.CONVERSATION_NOT_IN_PROGRESS);
        }

        c.setStatus(Conversation.ConversationStatus.RESOLVED);
        c.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(c);

        log.info("Conversation {} resolved by {}", conversationId, pharmacistId);
        return toResponse(c);
    }

    /**
     * Lấy chi tiết một conversation.
     */
    public ConversationResponse getById(String conversationId) {
        return toResponse(
                conversationRepository.findById(conversationId)
                        .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND))
        );
    }

    /**
     * Lấy danh sách conversation của một user cụ thể.
     */
    public List<ConversationResponse> listByUser(String userId) {
        return conversationRepository.findByUserIdOrderByLastMessageAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private ConversationResponse toResponse(Conversation c) {
        return ConversationResponse.builder()
                .id(c.getId())
                .userId(c.getUserId())
                .pharmacistId(c.getPharmacistId())
                .status(c.getStatus())
                .lastMessageAt(c.getLastMessageAt())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
