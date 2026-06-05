import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Send, X, RefreshCw, MessageSquare } from 'lucide-react';
import chatAvatar from '../../assets/avatar-chat.png';
import chatService from '../../services/chat/chatService';
import {
    connectSocket,
    disconnectSocket,
    subscribeConversation,
    subscribeErrors,
    sendMessage,
    isConnected,
} from '../../services/chat/chatSocket';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const STATUS_CONFIG = {
    PENDING:     { label: 'Chờ dược sĩ',   cls: 'bg-amber-50 text-amber-600 border-amber-200' },
    IN_PROGRESS: { label: 'Đang tư vấn',   cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    RESOLVED:    { label: 'Đã giải quyết', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
    CLOSED:      { label: 'Đã đóng',       cls: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const BUBBLE = {
    USER:       { wrap: 'ml-auto flex-row-reverse', box: 'bg-blue-600 text-white rounded-tr-none', name: '' },
    PHARMACIST: { wrap: 'mr-auto',                  box: 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm', name: 'text-emerald-600' },
    BOT:        { wrap: 'mr-auto',                  box: 'bg-slate-100 border border-slate-200 text-slate-700 rounded-tl-none italic', name: 'text-slate-400' },
    ADMIN:      { wrap: 'mr-auto',                  box: 'bg-purple-50 border border-purple-100 text-slate-800 rounded-tl-none', name: 'text-purple-500' },
};

const MessageBubble = ({ msg, currentUserId }) => {
    const isMine = msg.senderRole === 'USER';
    const cfg = BUBBLE[msg.senderRole] || BUBBLE.BOT;
    const time = msg.createdAt
        ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : '';

    return (
        <div className={`flex gap-2 max-w-[80%] ${cfg.wrap}`}>
            {!isMine && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
                    {msg.senderRole === 'BOT'
                        ? <img src={chatAvatar} alt="" className="w-full h-full object-cover" />
                        : <span className="text-xs font-bold text-slate-500">{msg.senderDisplayName?.charAt(0)?.toUpperCase() || 'DS'}</span>}
                </div>
            )}
            <div className="flex flex-col gap-0.5">
                {!isMine && msg.senderDisplayName && (
                    <span className={`text-[11px] font-semibold px-1 ${cfg.name}`}>
                        {msg.senderDisplayName}
                    </span>
                )}
                <div className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${cfg.box}`}>
                    {msg.messageType === 'IMAGE' && msg.fileUrl
                        ? <img src={msg.fileUrl} alt={msg.fileName || ''} className="max-w-[200px] rounded-lg" />
                        : msg.messageType === 'FILE' && msg.fileUrl
                            ? <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="underline text-blue-300 text-xs">📎 {msg.fileName || 'File'}</a>
                            : msg.content}
                </div>
                <span className={`text-[10px] text-slate-400 px-1 ${isMine ? 'text-right' : 'text-left'}`}>{time}</span>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
export default function ChatPage() {
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);

    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [msgLoading, setMsgLoading] = useState(false);
    const [wsReady, setWsReady] = useState(false);
    const [wsError, setWsError] = useState(false);

    const messagesEndRef = useRef(null);
    const subConvRef = useRef(null);
    const subErrRef = useRef(null);

    const canSend = wsReady && activeConv?.status !== 'CLOSED';

    // ── Scroll ──────────────────────────────────────────────────────────────
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    // ── Connect WS ───────────────────────────────────────────────────────────
    useEffect(() => {
        const setup = () => {
            subErrRef.current = subscribeErrors((err) => {
                toast.error(err.message || 'Lỗi server');
            });
            setWsReady(true);
            setWsError(false);
        };

        if (isConnected()) {
            setup();
        } else {
            connectSocket({
                onConnect: setup,
                onDisconnect: () => setWsReady(false),
                onError: () => { setWsReady(false); setWsError(true); },
            });
        }

        return () => {
            subErrRef.current?.unsubscribe?.();
            subConvRef.current?.unsubscribe?.();
        };
    }, []);

    // ── Load conversations ────────────────────────────────────────────────────
    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        setLoading(true);
        try {
            const res = await chatService.getMyConversations();
            const list = res.data?.result?.content || res.data?.result || [];
            setConversations(list);
            // Auto-select first open conversation
            const open = list.find(c => c.status !== 'CLOSED');
            if (open) selectConversation(open);
        } catch (e) {
            toast.error('Không tải được danh sách hội thoại');
        } finally {
            setLoading(false);
        }
    };

    // ── Select & load messages ────────────────────────────────────────────────
    const selectConversation = async (conv) => {
        setActiveConv(conv);
        setMessages([]);
        subConvRef.current?.unsubscribe?.();

        setMsgLoading(true);
        try {
            const res = await chatService.getMessages(conv.id, 0, 50);
            setMessages(res.data?.result?.content || []);
        } catch (e) {
            toast.error('Không tải được tin nhắn');
        } finally {
            setMsgLoading(false);
        }

        // Subscribe realtime
        if (isConnected()) {
            subConvRef.current = subscribeConversation(conv.id, (payload) => {
                if (payload.status !== undefined) {
                    // ConversationResponse — status changed
                    setActiveConv(prev => prev?.id === payload.id ? payload : prev);
                    setConversations(prev =>
                        prev.map(c => c.id === payload.id ? payload : c)
                    );
                } else {
                    // MessageResponse
                    setMessages(prev => {
                        if (prev.some(m => m.id === payload.id)) return prev;
                        return [...prev, payload];
                    });
                }
            });
        }
    };

    // ── Send ──────────────────────────────────────────────────────────────────
    const handleSend = (e) => {
        e.preventDefault();
        const text = inputText.trim();
        if (!text || !canSend) return;

        const ok = sendMessage({
            conversationId: activeConv?.id || null,
            messageType: 'TEXT',
            content: text,
        });

        if (ok) {
            setInputText('');
        } else {
            toast.error('Chưa kết nối, vui lòng thử lại');
        }
    };

    // ── Close conversation ────────────────────────────────────────────────────
    const handleClose = async () => {
        if (!activeConv?.id) return;
        try {
            await chatService.closeConversation(activeConv.id);
            const updated = { ...activeConv, status: 'CLOSED' };
            setActiveConv(updated);
            setConversations(prev => prev.map(c => c.id === updated.id ? updated : c));
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

    const formatTime = (t) => t ? new Date(t).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

    return (
        <div className="min-h-screen bg-[#F1F5F9] text-[#1C2434]">
            <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
                {/* Page header */}
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-[#1C2434]">Tư vấn dược sĩ</h1>
                        <p className="text-xs text-[#64748B] mt-0.5">Nhận tư vấn trực tiếp từ đội ngũ dược sĩ</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {wsError && (
                            <button onClick={handleReconnect} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs hover:bg-red-100 transition-all">
                                <RefreshCw size={13} /> Kết nối lại
                            </button>
                        )}
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${wsReady ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${wsReady ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                            {wsReady ? 'Đã kết nối' : 'Đang kết nối...'}
                        </span>
                    </div>
                </div>

                <div className="flex flex-1 gap-4 min-h-0">
                    {/* LEFT — Conversation list */}
                    <div className="w-72 flex-shrink-0 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col overflow-hidden">
                        <div className="p-3 border-b border-[#E2E8F0] flex items-center justify-between">
                            <span className="text-sm font-bold text-[#1C2434]">Hội thoại</span>
                            <button
                                onClick={loadConversations}
                                className="p-1 rounded hover:bg-[#F1F5F9] text-[#64748B] transition-all"
                                title="Làm mới"
                            >
                                <RefreshCw size={13} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-6 text-center text-xs text-[#64748B]">
                                    <div className="animate-spin inline-block w-4 h-4 border-2 border-[#3C50E0] border-t-transparent rounded-full mb-2" />
                                    <p>Đang tải...</p>
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="p-6 text-center text-xs text-[#64748B] flex flex-col items-center gap-2">
                                    <MessageSquare size={28} className="text-slate-300" />
                                    <p>Chưa có hội thoại</p>
                                    <p className="text-[10px] text-[#8A99AD]">Nhắn tin để bắt đầu</p>
                                </div>
                            ) : conversations.map(conv => {
                                const isActive = activeConv?.id === conv.id;
                                const statusCfg = STATUS_CONFIG[conv.status] || STATUS_CONFIG.CLOSED;
                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => selectConversation(conv)}
                                        className={`w-full text-left px-3 py-3 border-b border-[#F1F5F9] transition-all ${isActive ? 'bg-[#EBF0FF]' : 'hover:bg-[#F8FAFC]'}`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className="w-8 h-8 rounded-full bg-[#EBF0FF] flex items-center justify-center text-[#3C50E0] font-bold text-xs flex-shrink-0 mt-0.5">
                                                <img src={chatAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className={`text-[11px] font-semibold ${isActive ? 'text-[#3C50E0]' : 'text-[#1C2434]'}`}>Tư vấn dược sĩ</span>
                                                    <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${statusCfg.cls}`}>
                                                        {statusCfg.label}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-[#64748B] truncate mt-0.5">
                                                    {conv.lastMessageContent || 'Chưa có tin nhắn'}
                                                </p>
                                                <p className="text-[9px] text-[#8A99AD] mt-0.5">{formatTime(conv.lastMessageAt)}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT — Chat area */}
                    <div className="flex-1 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col min-h-0 overflow-hidden">
                        {activeConv ? (
                            <>
                                {/* Chat header */}
                                <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between flex-shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden">
                                            <img src={chatAvatar} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#1C2434]">Nhà thuốc Quốc Thái</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_CONFIG[activeConv.status]?.cls}`}>
                                                    {STATUS_CONFIG[activeConv.status]?.label || activeConv.status}
                                                </span>
                                                {activeConv.status === 'IN_PROGRESS' && (
                                                    <span className="text-[10px] text-emerald-600">● Dược sĩ đang online</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {activeConv.status !== 'CLOSED' && (
                                        <button
                                            onClick={handleClose}
                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all"
                                        >
                                            <X size={13} /> Kết thúc
                                        </button>
                                    )}
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
                                    {msgLoading ? (
                                        <div className="flex justify-center items-center h-full">
                                            <div className="animate-spin w-6 h-6 border-[2.5px] border-[#3C50E0] border-t-transparent rounded-full" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-2 text-[#64748B]">
                                            <MessageSquare size={36} className="text-slate-300" />
                                            <p className="text-sm">Hãy gửi tin nhắn đầu tiên</p>
                                        </div>
                                    ) : (
                                        messages.map((msg, idx) => (
                                            <MessageBubble key={msg.id || idx} msg={msg} currentUserId={user?.id} />
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Status notices */}
                                {activeConv.status === 'CLOSED' && (
                                    <div className="px-4 py-2 bg-gray-50 border-t border-[#E2E8F0] text-center text-xs text-[#64748B] flex-shrink-0">
                                        Hội thoại đã đóng.{' '}
                                        <button
                                            onClick={() => { setActiveConv(null); setMessages([]); setConversations(prev => prev.filter(c => c.id !== activeConv.id)); }}
                                            className="text-[#3C50E0] underline"
                                        >
                                            Bắt đầu hội thoại mới
                                        </button>
                                    </div>
                                )}
                                {activeConv.status === 'RESOLVED' && (
                                    <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 text-center text-xs text-blue-600 flex-shrink-0">
                                        Tư vấn đã hoàn tất. Nhắn tin tiếp để mở lại.
                                    </div>
                                )}
                                {activeConv.status === 'PENDING' && (
                                    <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 text-center text-xs text-amber-600 flex-shrink-0">
                                        Đang chờ dược sĩ nhận tư vấn...
                                    </div>
                                )}

                                {/* Input */}
                                {activeConv.status !== 'CLOSED' && (
                                    <form
                                        onSubmit={handleSend}
                                        className="flex items-center gap-2 px-4 py-3 border-t border-[#E2E8F0] bg-white flex-shrink-0"
                                    >
                                        <input
                                            type="text"
                                            value={inputText}
                                            onChange={e => setInputText(e.target.value)}
                                            placeholder={canSend ? 'Nhắn tin...' : 'Đang kết nối...'}
                                            disabled={!canSend}
                                            className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-4 py-2 text-sm text-[#1C2434] placeholder-[#8A99AD] focus:outline-none focus:border-[#3C50E0] disabled:opacity-50 transition-all"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!inputText.trim() || !canSend}
                                            className="w-10 h-10 rounded-full bg-[#3C50E0] text-white flex items-center justify-center hover:bg-opacity-90 transition-all disabled:opacity-40"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </form>
                                )}
                            </>
                        ) : (
                            /* No conversation selected */
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#EBF0FF]">
                                    <img src={chatAvatar} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#1C2434]">Tư vấn dược sĩ trực tuyến</h3>
                                    <p className="text-sm text-[#64748B] mt-1">Nhắn tin ngay để được dược sĩ hỗ trợ</p>
                                </div>
                                <button
                                    disabled={!canSend}
                                    onClick={() => {
                                        if (!wsReady) { toast('Đang kết nối...', { icon: '⏳' }); return; }
                                        // Gửi tin nhắn trống để trigger tạo conversation mới
                                        const text = 'Xin chào, tôi cần tư vấn';
                                        const ok = sendMessage({ conversationId: null, messageType: 'TEXT', content: text });
                                        if (ok) {
                                            // Reload sau vài giây để lấy conversation mới
                                            setTimeout(loadConversations, 1500);
                                        }
                                    }}
                                    className="px-6 py-2.5 bg-[#3C50E0] text-white rounded-xl text-sm font-medium hover:bg-opacity-90 transition-all disabled:opacity-50"
                                >
                                    Bắt đầu tư vấn
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
