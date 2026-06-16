import { createSlice } from '@reduxjs/toolkit';

/**
 * Chat Redux Slice — Shared Inbox model (Messenger/Zalo style).
 *
 * State:
 *   isChatOpen          — floating chat widget có mở không (khách hàng)
 *   conversation        — conversation hiện tại của user (null nếu chưa có)
 *   messages            — mảng tin nhắn của conversation hiện tại
 *   conversations       — danh sách tất cả conversations (pharmacist shared inbox)
 *   activeConversationId — conversation đang active trong inbox của dược sĩ
 */
const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        // Customer side
        isChatOpen: false,
        conversation: null,
        messages: [],

        // Pharmacist shared inbox
        conversations: [],
        activeConversationId: null,
    },
    reducers: {
        // ── Customer UI ───────────────────────────────────────────────────────
        openChat: (state) => { state.isChatOpen = true; },
        closeChat: (state) => { state.isChatOpen = false; },
        toggleChat: (state) => { state.isChatOpen = !state.isChatOpen; },

        setConversation: (state, action) => {
            state.conversation = action.payload;
        },

        setMessages: (state, action) => {
            state.messages = action.payload;
        },

        /** Thêm tin nhắn mới vào cuối, tránh duplicate */
        appendMessage: (state, action) => {
            const msg = action.payload;
            if (!state.messages.some(m => m.id === msg.id)) {
                state.messages.push(msg);
            }
        },

        // ── Pharmacist shared inbox ───────────────────────────────────────────
        setConversations: (state, action) => {
            state.conversations = action.payload;
        },

        setActiveConversationId: (state, action) => {
            state.activeConversationId = action.payload;
        },

        /**
         * Nhận conversation update realtime (từ /topic/conversations).
         * - Nếu conversation đã có trong list → cập nhật và đưa lên đầu
         * - Nếu chưa có → thêm vào đầu danh sách
         * Kết quả: conversation có tin nhắn mới nhất luôn ở đầu.
         */
        upsertConversation: (state, action) => {
            const updated = action.payload;
            const idx = state.conversations.findIndex(c => c.id === updated.id);
            if (idx >= 0) {
                // Xóa khỏi vị trí cũ
                state.conversations.splice(idx, 1);
            }
            // Thêm vào đầu danh sách
            state.conversations.unshift(updated);
        },

        /**
         * Reset unreadCount của 1 conversation (khi dược sĩ mở).
         */
        resetUnread: (state, action) => {
            const convId = action.payload;
            const conv = state.conversations.find(c => c.id === convId);
            if (conv) conv.unreadCount = 0;
        },

        /**
         * Thêm tin nhắn vào conversation đang active trong pharmacist inbox.
         */
        appendMessageToInbox: (state, action) => {
            const msg = action.payload;
            if (!state.messages.some(m => m.id === msg.id)) {
                state.messages.push(msg);
            }
        },
    },
});

export const {
    openChat,
    closeChat,
    toggleChat,
    setConversation,
    setMessages,
    appendMessage,
    setConversations,
    setActiveConversationId,
    upsertConversation,
    resetUnread,
    appendMessageToInbox,
} = chatSlice.actions;

export default chatSlice.reducer;
