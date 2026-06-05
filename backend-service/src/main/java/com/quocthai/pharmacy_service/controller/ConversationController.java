package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.ConversationResponse;
import com.quocthai.pharmacy_service.dto.response.MessageResponse;
import com.quocthai.pharmacy_service.dto.response.PageResponse;
import com.quocthai.pharmacy_service.entity.Conversation;
import com.quocthai.pharmacy_service.service.ChatService;
import com.quocthai.pharmacy_service.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * REST API cho module tư vấn.
 *
 * ── USER ──────────────────────────────────────────────────────────────────────
 * GET  /conversations/my               — lịch sử conversation của user đang đăng nhập
 * GET  /conversations/{id}/messages    — load lịch sử tin nhắn của 1 conversation (có phân trang)
 * POST /conversations/{id}/close       — user chủ động đóng hội thoại
 *
 * ── PHARMACIST ────────────────────────────────────────────────────────────────
 * GET  /conversations/waiting          — danh sách PENDING (hàng đợi)
 * GET  /conversations?status=...       — lọc theo status (PENDING/IN_PROGRESS/RESOLVED)
 * POST /conversations/{id}/claim       — nhận tư vấn (PENDING → IN_PROGRESS, chống race condition)
 * POST /conversations/{id}/resolve     — hoàn tất tư vấn (IN_PROGRESS → RESOLVED)
 *
 * ── ADMIN ─────────────────────────────────────────────────────────────────────
 * GET  /conversations/admin/all        — tất cả conversation, phân trang
 * GET  /conversations/admin/{id}/messages — xem lịch sử bất kỳ conversation (read-only)
 */
@RestController
@RequestMapping("/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final ChatService chatService;

    // ── USER ──────────────────────────────────────────────────────────────────

    /**
     * User xem lịch sử hội thoại của chính mình.
     * GET /conversations/my?page=0&size=10
     */
    @GetMapping("/my")
    public ApiResponse<PageResponse<ConversationResponse>> getMyConversations(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.<PageResponse<ConversationResponse>>builder()
                .result(conversationService.getMyConversations(page, size))
                .build();
    }

    /**
     * Load lịch sử tin nhắn của 1 conversation (user/pharmacist/admin).
     * GET /conversations/{id}/messages?page=0&size=30
     */
    @GetMapping("/{id}/messages")
    public ApiResponse<PageResponse<MessageResponse>> getMessages(
            @PathVariable String id,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "30") int size) {
        return ApiResponse.<PageResponse<MessageResponse>>builder()
                .result(conversationService.getMessages(id, page, size))
                .build();
    }

    /**
     * User chủ động kết thúc hội thoại.
     * POST /conversations/{id}/close
     *
     * Ghi chú: conversation CLOSED không được tạo lại.
     * Nếu user muốn tư vấn tiếp phải tạo Conversation mới qua WebSocket.
     */
    @PostMapping("/{id}/close")
    public ApiResponse<ConversationResponse> closeConversation(
            @PathVariable String id,
            Principal principal) {
        return ApiResponse.<ConversationResponse>builder()
                .result(chatService.closeConversation(id, principal))
                .build();
    }

    // ── PHARMACIST ────────────────────────────────────────────────────────────

    /**
     * Danh sách hội thoại đang chờ dược sĩ nhận (PENDING), kèm summary.
     * GET /conversations/waiting?page=0&size=20
     */
    @GetMapping("/waiting")
    @PreAuthorize("hasAnyRole('ROLE_PHARMACIST', 'ROLE_ADMIN')")
    public ApiResponse<PageResponse<ConversationResponse>> getWaiting(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.<PageResponse<ConversationResponse>>builder()
                .result(conversationService.getWaitingConversations(page, size))
                .build();
    }

    /**
     * Lọc conversation theo status.
     * GET /conversations?status=IN_PROGRESS&page=0&size=20
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ApiResponse<PageResponse<ConversationResponse>> getByStatus(
            @RequestParam(required = false) Conversation.ConversationStatus status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        if (status == null) {
            // Không có filter → trả về waiting list mặc định
            return ApiResponse.<PageResponse<ConversationResponse>>builder()
                    .result(conversationService.getWaitingConversations(page, size))
                    .build();
        }
        return ApiResponse.<PageResponse<ConversationResponse>>builder()
                .result(conversationService.getConversationsByStatus(status, page, size))
                .build();
    }

    /**
     * Dược sĩ nhận tư vấn.
     * POST /conversations/{id}/claim
     *
     * Dùng optimistic lock + saveAndFlush để chống race condition khi
     * nhiều dược sĩ claim đồng thời.
     */
    @PostMapping("/{id}/claim")
    @PreAuthorize("hasRole('PHARMACIST')")
    public ApiResponse<ConversationResponse> claim(
            @PathVariable String id,
            Principal principal) {
        return ApiResponse.<ConversationResponse>builder()
                .result(chatService.claimConversation(id, principal))
                .build();
    }

    /**
     * Dược sĩ hoàn tất tư vấn.
     * POST /conversations/{id}/resolve
     */
    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasRole('PHARMACIST')")
    public ApiResponse<ConversationResponse> resolve(
            @PathVariable String id,
            Principal principal) {
        return ApiResponse.<ConversationResponse>builder()
                .result(chatService.resolveConversation(id, principal))
                .build();
    }

    // ── ADMIN ─────────────────────────────────────────────────────────────────

    /**
     * Admin xem tất cả conversation, phân trang.
     * GET /conversations/admin/all?page=0&size=20
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PageResponse<ConversationResponse>> getAllAdmin(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.<PageResponse<ConversationResponse>>builder()
                .result(conversationService.getAllConversations(page, size))
                .build();
    }
}
