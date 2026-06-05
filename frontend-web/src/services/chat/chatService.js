import axiosClient from '../../configs/axiosConfig.js';

const chatService = {
    // ── USER ──────────────────────────────────────────────────────────────────
    getMyConversations: () =>
        axiosClient.get('/conversations/my'),

    getMessages: (id, page = 0, size = 30) =>
        axiosClient.get(`/conversations/${id}/messages`, { params: { page, size } }),

    closeConversation: (id) =>
        axiosClient.post(`/conversations/${id}/close`),

    // ── PHARMACIST ────────────────────────────────────────────────────────────
    getWaitingConversations: (page = 0, size = 20) =>
        axiosClient.get('/conversations/waiting', { params: { page, size } }),

    getConversations: (params) =>
        axiosClient.get('/conversations', { params }),

    claimConversation: (id) =>
        axiosClient.post(`/conversations/${id}/claim`),

    resolveConversation: (id) =>
        axiosClient.post(`/conversations/${id}/resolve`),

    // ── ADMIN ─────────────────────────────────────────────────────────────────
    getAllConversations: (page = 0, size = 20) =>
        axiosClient.get('/conversations/admin/all', { params: { page, size } }),
};

export default chatService;
