import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const BASE_WS_URL = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace('/pharmacy', '') + '/pharmacy/ws'
    : 'http://localhost:8080/pharmacy/ws';

let stompClient = null;

// ─────────────────────────────────────────────────────────────────────────────
// CONNECT
// ─────────────────────────────────────────────────────────────────────────────
const connectSocket = ({ onConnect, onError, onDisconnect } = {}) => {
    if (stompClient && stompClient.connected) return stompClient;

    const token = localStorage.getItem('accessToken');

    stompClient = new Client({
        webSocketFactory: () => new SockJS(BASE_WS_URL),
        connectHeaders: {
            Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: (frame) => {
            console.log('[WS] Connected:', frame);
            if (onConnect) onConnect(frame);
        },
        onStompError: (frame) => {
            console.error('[WS] STOMP error:', frame.headers?.message);
            if (onError) onError(frame);
        },
        onDisconnect: () => {
            console.log('[WS] Disconnected');
            if (onDisconnect) onDisconnect();
        },
        onWebSocketError: (error) => {
            console.error('[WS] WebSocket error:', error);
            if (onError) onError(error);
        },
    });

    stompClient.activate();
    return stompClient;
};

// ─────────────────────────────────────────────────────────────────────────────
// DISCONNECT
// ─────────────────────────────────────────────────────────────────────────────
const disconnectSocket = () => {
    if (stompClient) {
        stompClient.deactivate();
        stompClient = null;
        console.log('[WS] Deactivated');
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIBE — chat room của 1 conversation
// /topic/conversation/{id} → nhận MessageResponse realtime
// ─────────────────────────────────────────────────────────────────────────────
const subscribeConversation = (conversationId, callback) => {
    if (!stompClient || !stompClient.connected) {
        console.warn('[WS] Not connected — cannot subscribe conversation');
        return null;
    }
    return stompClient.subscribe(`/topic/conversation/${conversationId}`, (message) => {
        try {
            callback(JSON.parse(message.body));
        } catch (e) {
            console.error('[WS] Failed to parse message:', e);
        }
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIBE — shared inbox (pharmacist/admin)
// /topic/conversations → nhận ConversationResponse khi có tin mới
// Dùng để cập nhật danh sách conversation, đưa conversation mới nhất lên đầu
// ─────────────────────────────────────────────────────────────────────────────
const subscribeInbox = (callback) => {
    if (!stompClient || !stompClient.connected) {
        console.warn('[WS] Not connected — cannot subscribe inbox');
        return null;
    }
    return stompClient.subscribe('/topic/conversations', (message) => {
        try {
            callback(JSON.parse(message.body));
        } catch (e) {
            console.error('[WS] Failed to parse inbox update:', e);
        }
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIBE — errors (personal queue)
// ─────────────────────────────────────────────────────────────────────────────
const subscribeErrors = (callback) => {
    if (!stompClient || !stompClient.connected) return null;
    return stompClient.subscribe('/user/queue/errors', (message) => {
        try {
            callback(JSON.parse(message.body));
        } catch (e) {
            callback({ message: message.body });
        }
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// SEND MESSAGE
// payload: { conversationId, messageType, content, fileUrl, fileName }
// conversationId có thể null nếu user chưa có conversation → backend tự tạo
// ─────────────────────────────────────────────────────────────────────────────
const sendMessage = (payload) => {
    if (!stompClient || !stompClient.connected) {
        console.warn('[WS] Not connected — cannot send message');
        return false;
    }
    stompClient.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(payload),
    });
    return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// MARK AS READ via WebSocket
// Gửi conversationId để backend reset unreadCount
// ─────────────────────────────────────────────────────────────────────────────
const markAsReadWs = (conversationId) => {
    if (!stompClient || !stompClient.connected) return false;
    stompClient.publish({
        destination: '/app/chat.read',
        body: conversationId,
    });
    return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// GETTERS
// ─────────────────────────────────────────────────────────────────────────────
const getClient = () => stompClient;
const isConnected = () => !!(stompClient && stompClient.connected);

export {
    connectSocket,
    disconnectSocket,
    subscribeConversation,
    subscribeInbox,
    subscribeErrors,
    sendMessage,
    markAsReadWs,
    getClient,
    isConnected,
};
