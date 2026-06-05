import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Paperclip, RefreshCw } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import chatIcon from '../../assets/chat.png';
import chatAvatar from '../../assets/avatar-chat.png';
import { openLoginModal } from '../../redux/slices/authSlice';
import { toggleChat, closeChat } from '../../redux/slices/chatSlice';
import chatService from '../../services/chat/chatService';
import {
    connectSocket,
    disconnectSocket,
    subscribeConversation,
    subscribeErrors,
    sendMessage,
    isConnected,
} from '../../services/chat/chatSocket';

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    PENDING:     { label: 'Chờ dược sĩ',   cls: 'bg-amber-50 text-amber-600 border-amber-200' },
    IN_PROGRESS: { label: 'Đang tư vấn',   cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    RESOLVED:    { label: 'Đã giải quyết', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
    CLOSED:      { label: 'Đã đóng',       cls: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || { label: status, cls: 'bg-gray-100 text-gray-500' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
};

// ── Message bubble ────────────────────────────────────────────────────────────
const BUBBLE_CONFIG = {
    USER:       { align: 'ml-auto flex-row-reverse', bubble: 'bg-blue-50 border border-blue-100 text-slate-800 rounded-tr-none', nameColor: 'text-blue-500' },
    PHARMACIST: { align: 'mr-auto',                  bubble: 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm', nameColor: 'text-emerald-600' },
    BOT:        { align: 'mr-auto',                  bubble: 'bg-slate-50 border border-slate-200 text-slate-700 rounded-tl-none italic', nameColor: 'text-slate-400' },
    ADMIN:      { align: 'mr-auto',                  bubble: 'bg-purple-50 border border-purple-100 text-slate-800 rounded-tl-none', nameColor: 'text-purple-500' },
};

const MessageBubble = ({ msg }) => {
    const cfg = BUBBLE_CONFIG[msg.senderRole] || BUBBLE_CONFIG.BOT;
    const isUser = msg.senderRole === 'USER';
    const time = msg.createdAt
        ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : '';

    return (
        <div className={`flex gap-2 max-w-[85%] ${cfg.align}`}>
            {!isUser && (
                <div className="w-7 h-7 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs overflow-hidden mt-1">
                    {msg.senderRole === 'BOT' ? (
                        <img src={chatAvatar} alt="bot" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[10px] font-bold text-slate-600">
                            {msg.senderRole === 'PHARMACIST' ? 'DS' : 'AD'}
                        </span>
                    )}
                </div>
            )}
            <div className="flex flex-col gap-0.5">
                {!isUser && (
                    <span className={`text-[10px] font-semibold ${cfg.nameColor} px-1`}>
                        {msg.senderDisplayName || (msg.senderRole === 'BOT' ? 'Bot Nhà Thuốc' : msg.senderRole)}
                    </span>
                )}
                <div className={`p-2.5 rounded-2xl text-[13px] leading-relaxed ${cfg.bubble}`}>
                    {msg.messageType === 'IMAGE' && msg.fileUrl ? (
                        <img src={msg.fileUrl} alt={msg.fileName || 'image'} className="max-w-[200px] rounded-lg" />
                    ) : msg.messageType === 'FILE' && msg.fileUrl ? (
                        <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="underline text-blue-600 text-xs">
                            📎 {msg.fileName || 'File đính kèm'}
                        </a>
                    ) : (
                        msg.content
                    )}
                </div>
                <span className={`text-[10px] text-slate-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>{time}</span>
            </div>
        </div>
    );
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function ChatAdvisor() {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const isChatOpen = useSelector((state) => state.chat.isChatOpen);
    const dispatch = useDispatch();

    const [messages, setMessages] = useState([]);
    const [conversation, setConversation] = useState(null); // active conversation
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [wsReady, setWsReady] = useState(false);
    const [wsError, setWsError] = useState(false);

    const messagesEndRef = useRef(null);
    const subConvRef = useRef(null);
    const subErrRef = useRef(null);
    const conversationIdRef = useRef(null); // track latest convId for WS callbacks

    // ── Scroll ──────────────────────────────────────────────────────────────
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (isChatOpen) scrollToBottom();
    }, [messages, isChatOpen, scrollToBottom]);

    // ── WS connect / disconnect ──────────────────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated) return;

        const client = connectSocket({
            onConnect: () => {
                setWsReady(true);
                setWsError(false);
                // subscribe error queue
                subErrRef.current = subscribeErrors((err) => {
                    toast.error(err.message || 'Lỗi kết nối');
                });
            },
            onDisconnect: () => setWsReady(false),
            onError: () => {
                setWsReady(false);
                setWsError(true);
            },
        });

        return () => {
            subErrRef.current?.unsubscribe?.();
            subConvRef.current?.unsubscribe?.();
            disconnectSocket();
        };
    }, [isAuthenticated]);

    // ── Re-subscribe khi conversation thay đổi ──────────────────────────────
    useEffect(() => {
        if (!conversation?.id || !wsReady) return;

        subConvRef.current?.unsubscribe?.();
        conversationIdRef.current = conversation.id;

        subConvRef.current = subscribeConversation(conversation.id, (msg) => {
            setMessages((prev) => {
                // Tránh duplicate
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        });

        return () => {
            subConvRef.current?.unsubscribe?.();
        };
    }, [conversation?.id, wsReady]);

    // ── Load conversation khi mở chat ────────────────────────────────────────
    useEffect(() => {
        if (!isChatOpen || !isAuthenticated) return;
        loadMyConversation();
    }, [isChatOpen, isAuthenticated]);

    const loadMyConversation = async () => {
        try {
            setLoading(true);
            const res = await chatService.getMyConversations();
            const list = res.data?.result?.content || res.data?.result || [];
            const active = list.find(c => c.status !== 'CLOSED');
            if (active) {
                setConversation(active);
                await loadMessages(active.id);
            } else {
                setConversation(null);
                setMessages([]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (convId, page = 0) => {
        try {
            const res = await chatService.getMessages(convId, page, 50);
            const msgs = res.data?.result?.content || [];
            setMessages(msgs);
        } catch (e) {
            console.error(e);
        }
    };

    // ── Send message ─────────────────────────────────────────────────────────
    const handleSend = (e) => {
        e.preventDefault();
        const text = inputText.trim();
        if (!text) return;
        if (!wsReady) {
            toast.error('Chưa kết nối, thử lại sau...');
            return;
        }
        if (conversation?.status === 'CLOSED') {
            toast('Cuộc trò chuyện đã đóng. Hãy bắt đầu hội thoại mới.', { icon: 'ℹ️' });
            return;
        }

        const ok = sendMessage({
            conversationId: conversation?.id || null,
            messageType: 'TEXT',
            content: text,
        });

        if (ok) setInputText('');
    };

    // ── Close conversation ────────────────────────────────────────────────────
    const handleClose = async () => {
        if (!conversation?.id) return;
        try {
            await chatService.closeConversation(conversation.id);
            setConversation(prev => prev ? { ...prev, status: 'CLOSED' } : prev);
            toast.success('Đã kết thúc tư vấn');
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Không thể đóng hội thoại');
        }
    };

    // ── Reconnect ─────────────────────────────────────────────────────────────
    const handleReconnect = () => {
        disconnectSocket();
        setTimeout(() => {
            connectSocket({
                onConnect: () => { setWsReady(true); setWsError(false); },
                onDisconnect: () => setWsReady(false),
                onError: () => { setWsReady(false); setWsError(true); },
            });
        }, 300);
    };

    // ── Button click ─────────────────────────────────────────────────────────
    const handleChatButtonClick = () => {
        if (!isAuthenticated) { dispatch(openLoginModal()); return; }
        dispatch(toggleChat());
    };

    const canSend = conversation?.status !== 'CLOSED' && wsReady;
    const convStatus = conversation?.status;

    return (
        <div className="font-sans">
            {/* ── CHAT WINDOW ──────────────────────────────────────────────────── */}
            {isChatOpen && (
                <div className="
                    fixed z-[9999] bg-white border border-slate-100 shadow-2xl flex flex-col overflow-hidden
                    bottom-4 right-4 left-4 top-4 rounded-2xl
                    sm:top-auto sm:left-auto sm:bottom-28 sm:right-6 sm:w-[380px] sm:h-[540px] sm:max-h-[75vh]
                ">
                    {/* Header */}
                    <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                <img src={chatAvatar} alt="avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-blue-600 font-bold tracking-wider uppercase leading-none">Nhà Thuốc</span>
                                <span className="text-sm font-black text-blue-800 tracking-wide">QUỐC THÁI</span>
                            </div>
                            {convStatus && (
                                <div className="ml-2"><StatusBadge status={convStatus} /></div>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {wsError && (
                                <button
                                    onClick={handleReconnect}
                                    title="Kết nối lại"
                                    className="p-1.5 rounded-full hover:bg-slate-100 text-red-400 transition-colors"
                                >
                                    <RefreshCw size={15} />
                                </button>
                            )}
                            {conversation && convStatus !== 'CLOSED' && (
                                <button
                                    onClick={handleClose}
                                    title="Kết thúc tư vấn"
                                    className="px-2 py-1 text-[10px] font-medium text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    Kết thúc
                                </button>
                            )}
                            <button
                                onClick={() => dispatch(closeChat())}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* WS Status bar */}
                    {!wsReady && isAuthenticated && (
                        <div className="px-3 py-1 bg-amber-50 border-b border-amber-100 text-[10px] text-amber-600 flex items-center gap-1.5 flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            {wsError ? 'Mất kết nối — nhấn nút làm mới để kết nối lại' : 'Đang kết nối...'}
                        </div>
                    )}

                    {/* Messages */}
                    <div className="flex-1 p-3 overflow-y-auto bg-slate-50 space-y-3">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="animate-spin w-5 h-5 border-[2.5px] border-[#3C50E0] border-t-transparent rounded-full" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                                <img src={chatAvatar} alt="" className="w-14 h-14 opacity-40" />
                                <p className="text-[13px]">Nhắn tin để bắt đầu tư vấn</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <MessageBubble key={msg.id || idx} msg={msg} />
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* CLOSED notice */}
                    {convStatus === 'CLOSED' && (
                        <div className="px-3 py-2 bg-gray-50 border-t border-slate-100 text-center text-[11px] text-slate-500 flex-shrink-0">
                            Hội thoại đã đóng.{' '}
                            <button
                                onClick={() => { setConversation(null); setMessages([]); }}
                                className="text-blue-500 underline"
                            >
                                Tạo hội thoại mới
                            </button>
                        </div>
                    )}

                    {/* RESOLVED notice */}
                    {convStatus === 'RESOLVED' && (
                        <div className="px-3 py-1.5 bg-blue-50 border-t border-blue-100 text-center text-[11px] text-blue-600 flex-shrink-0">
                            Tư vấn đã hoàn tất. Nhắn tin tiếp để mở lại hội thoại.
                        </div>
                    )}

                    {/* Input */}
                    {convStatus !== 'CLOSED' && (
                        <form
                            onSubmit={handleSend}
                            className="p-1 bg-white border-t border-slate-100 flex items-center gap-1 flex-shrink-0"
                        >
                            <button type="button" className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
                                <Paperclip size={16} />
                            </button>
                            <input
                                type="text"
                                placeholder={canSend ? 'Nhắn tin...' : 'Đang kết nối...'}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                disabled={!canSend}
                                className="flex-1 bg-slate-100 border-0 outline-none text-[13px] px-3 py-2 rounded-full focus:ring-1 focus:ring-blue-400 disabled:opacity-50 text-slate-700"
                            />
                            <button
                                type="submit"
                                disabled={!inputText.trim() || !canSend}
                                className="p-2 rounded-full transition-colors disabled:text-slate-300 text-blue-600 hover:bg-blue-50"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    )}
                </div>
            )}

            {/* ── FLOATING BUTTON ──────────────────────────────────────────────── */}
            <div
                onClick={handleChatButtonClick}
                className="fixed z-[9999] cursor-pointer select-none transition-all duration-300 transform hover:scale-105 active:scale-95 drop-shadow-lg bottom-20 right-20 w-16 h-16 sm:bottom-8 sm:right-3 sm:w-20 sm:h-20"
            >
                <img src={chatIcon} alt="Tư vấn trực tuyến" className="w-16 h-16 object-contain" />
                {!wsReady && isAuthenticated && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white animate-pulse" />
                )}
            </div>
        </div>
    );
}
