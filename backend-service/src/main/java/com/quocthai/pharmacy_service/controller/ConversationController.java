package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.dto.request.CreateConversationRequest;
import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.ConversationResponse;
import com.quocthai.pharmacy_service.dto.response.MessageResponse;
import com.quocthai.pharmacy_service.entity.Conversation;
import com.quocthai.pharmacy_service.service.ChatService;
import com.quocthai.pharmacy_service.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final ChatService chatService;

    // ── User endpoints ────────────────────────────────────────────────────────

    /**
     * User tạo cuộc hội thoại tư vấn mới.
     * POST /conversations
     */
    @PostMapping
    public ApiResponse<ConversationResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody(required = false) CreateConversationRequest req) {

        String userId = jwt.getSubject();
        if (req == null) req = new CreateConversationRequest();
        return ApiResponse.<ConversationResponse>builder()
                .result(conversationService.create(userId, req))
                .build();
    }

    /**
     * User xem danh sách hội thoại của chính mình.
     * GET /conversations/my
     */
    @GetMapping("/my")
    public ApiResponse<List<ConversationResponse>> myConversations(
            @AuthenticationPrincipal Jwt jwt) {

        String userId = jwt.getSubject();
        return ApiResponse.<List<ConversationResponse>>builder()
                .result(conversationService.listByUser(userId))
                .build();
    }

    /**
     * Lấy lịch sử tin nhắn của một conversation.
     * GET /conversations/{id}/messages
     */
    @GetMapping("/{id}/messages")
    public ApiResponse<List<MessageResponse>> messages(@PathVariable String id) {
        return ApiResponse.<List<MessageResponse>>builder()
                .result(chatService.getMessages(id))
                .build();
    }

    // ── Pharmacist / Admin endpoints ──────────────────────────────────────────

    /**
     * Dược sĩ / Admin lấy danh sách hội thoại theo trạng thái.
     * GET /conversations?status=PENDING
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('PHARMACIST', 'ADMIN')")
    public ApiResponse<List<ConversationResponse>> list(
            @RequestParam(required = false) Conversation.ConversationStatus status) {

        return ApiResponse.<List<ConversationResponse>>builder()
                .result(conversationService.list(status))
                .build();
    }

    /**
     * Dược sĩ nhận tư vấn — khóa conversation, ngăn dược sĩ khác vào.
     * POST /conversations/{id}/claim
     */
    @PostMapping("/{id}/claim")
    @PreAuthorize("hasAnyAuthority('PHARMACIST', 'ADMIN')")
    public ApiResponse<ConversationResponse> claim(
            @PathVariable String id,
            @AuthenticationPrincipal Jwt jwt) {

        // Lấy pharmacistId từ JWT, không tin client
        String pharmacistId = jwt.getSubject();
        return ApiResponse.<ConversationResponse>builder()
                .result(conversationService.claim(id, pharmacistId))
                .build();
    }

    /**
     * Dược sĩ / Admin đánh dấu tư vấn hoàn tất.
     * POST /conversations/{id}/resolve
     */
    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyAuthority('PHARMACIST', 'ADMIN')")
    public ApiResponse<ConversationResponse> resolve(
            @PathVariable String id,
            @AuthenticationPrincipal Jwt jwt) {

        String pharmacistId = jwt.getSubject();
        return ApiResponse.<ConversationResponse>builder()
                .result(conversationService.resolve(id, pharmacistId))
                .build();
    }

    /**
     * Lấy chi tiết một conversation.
     * GET /conversations/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<ConversationResponse> getById(@PathVariable String id) {
        return ApiResponse.<ConversationResponse>builder()
                .result(conversationService.getById(id))
                .build();
    }
}
