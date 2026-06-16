package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.ConversationResponse;
import com.quocthai.pharmacy_service.dto.response.MessageResponse;
import com.quocthai.pharmacy_service.dto.response.PageResponse;
import com.quocthai.pharmacy_service.service.ChatService;
import com.quocthai.pharmacy_service.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * REST API cho module tư vấn — Shared Inbox model.
 *
 * ── USER ──────────────────────────────────────────────────────────────────────
 * GET  /conversations/my               — lấy conversation của user đang đăng nhập
 * GET  /conversations/{id}/messages    — load lịch sử tin nhắn (phân trang)
 *
 * ── PHARMACIST / ADMIN ────────────────────────────────────────────────────────
 * GET  /conversations                  — shared inbox (tất cả conversations, sort lastMessageAt DESC)
 * GET  /conversations/{id}/messages    — load lịch sử tin nhắn của bất kỳ conversation
 * POST /conversations/{id}/read        — đánh dấu đã đọc (reset unreadCount)
 *
 * Không còn: /waiting, /claim, /resolve, /close, status filter
 */
@RestController
@RequestMapping("/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final ChatService chatService;

    // ── USER ──────────────────────────────────────────────────────────────────

    /**
     * User lấy conversation của mình (1 user = 1 conversation).
     * Trả về null nếu chưa nhắn tin lần nào.
     * GET /conversations/my
     */
    @GetMapping("/my")
    public ApiResponse<ConversationResponse> getMyConversation() {
        return ApiResponse.<ConversationResponse>builder()
                .result(conversationService.getMyConversation())
                .build();
    }

    /**
     * Load lịch sử tin nhắn (user/pharmacist/admin).
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

    // ── PHARMACIST / ADMIN — Shared Inbox ─────────────────────────────────────

    /**
     * Shared inbox — tất cả conversations, sắp xếp lastMessageAt DESC.
     * GET /conversations?page=0&size=20
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ApiResponse<PageResponse<ConversationResponse>> getAllConversations(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.<PageResponse<ConversationResponse>>builder()
                .result(conversationService.getAllConversations(page, size))
                .build();
    }

    /**
     * Đánh dấu đã đọc — reset unreadCount = 0.
     * POST /conversations/{id}/read
     */
    @PostMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ApiResponse<Void> markAsRead(@PathVariable String id) {
        chatService.markAsRead(id);
        return ApiResponse.<Void>builder().build();
    }
}
