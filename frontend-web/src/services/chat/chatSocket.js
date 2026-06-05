import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const BASE_WS_URL = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace('/pharmacy', '') + '/pharmacy/ws'
    : 'http://localhost:8080/pharmacy/ws';

let stompClient = null;

// ─────────────────────────────────────────────────────────────────────────────
// CONNECT
// Lấy JWT từ localStorage và gửi trong Authorization header khi CONNECT.
// reconnectDelay: tự reconnect sau 5s nếu mất kết nối.
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
// Trả về subscription object. Gọi .unsubscribe() để hủy.
// ─────────────────────────────────────────────────────────────────────────────
const subscribeConversation = (conversationId, callback) => {
    if (!stompClient || !stompClient.connected) {
        console.warn('[WS] Not connected — cannot subscribe conversation');
        return null;
    }
    return stompClient.subscribe(`/topic/conversation/${conversationId}`, (message) => {
        try {
            const parsed = JSON.parse(message.body);
            callback(parsed);
        } catch (e) {
            console.error('[WS] Failed to parse message:', e);
        }
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIBE — waiting list (dược sĩ)
// ─────────────────────────────────────────────────────────────────────────────
const subscribeWaitingList = (callback) => {
    if (!stompClient || !stompClient.connected) {
        console.warn('[WS] Not connected — cannot subscribe waiting list');
        return null;
    }
    return stompClient.subscribe('/topic/conversations', (message) => {
        try {
            const parsed = JSON.parse(message.body);
            callback(parsed);
        } catch (e) {
            console.error('[WS] Failed to parse waiting list update:', e);
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
            const parsed = JSON.parse(message.body);
            callback(parsed);
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
// CLOSE CONVERSATION via WS
// ─────────────────────────────────────────────────────────────────────────────
const closeConversationWs = (conversationId) => {
    if (!stompClient || !stompClient.connected) return false;
    stompClient.publish({
        destination: '/app/conversation.close',
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
    subscribeWaitingList,
    subscribeErrors,
    sendMessage,
    closeConversationWs,
    getClient,
    isConnected,
};
