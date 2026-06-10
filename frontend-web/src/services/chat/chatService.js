import axiosClient from '../../configs/axiosConfig.js';

/**
 * Chat REST service — Shared Inbox model.
 *
 * API mới:
 *   GET  /conversations/my               — user lấy conversation của mình
 *   GET  /conversations/{id}/messages    — lịch sử tin nhắn
 *   GET  /conversations                  — pharmacist/admin shared inbox
 *   POST /conversations/{id}/read        — đánh dấu đã đọc
 */
const chatService = {
    // ── USER ──────────────────────────────────────────────────────────────────

    /** Lấy conversation duy nhất của user đang đăng nhập */
    getMyConversation: () =>
        axiosClient.get('/conversations/my'),

    getMessages: (id, page = 0, size = 30) =>
        axiosClient.get(`/conversations/${id}/messages`, { params: { page, size } }),

    // ── PHARMACIST / ADMIN — Shared Inbox ────────────────────────────────────

    /** Shared inbox — tất cả conversations, sort lastMessageAt DESC */
    getAllConversations: (page = 0, size = 20) =>
        axiosClient.get('/conversations', { params: { page, size } }),

    /** Đánh dấu đã đọc (reset unreadCount) */
    markAsRead: (id) =>
        axiosClient.post(`/conversations/${id}/read`),
};

export default chatService;
