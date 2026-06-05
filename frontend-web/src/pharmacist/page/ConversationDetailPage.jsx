import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Send, ArrowLeft, CheckCircle } from 'lucide-react';
import chatService from '../../services/chat/chatService';
import {
    connectSocket,
    subscribeConversation,
    subscribeErrors,
    sendMessage,
    isConnected,
} from '../../services/chat/chatSocket';

// ── helpers ───────────────────────────────────────────────────────────────────
const STATUS_BADGE = {
    PENDING:     'bg-amber-50 text-amber-600 border-amber-200',
    IN_PROGRESS: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    RESOLVED:    'bg-blue-50 text-blue-600 border-blue-200',
    CLOSED:      'bg-gray-100 text-gray-500 border-gray-200',
};
const STATUS_LABEL = {
    PENDING: 'Chờ nhận', IN_PROGRESS: 'Đang tư vấn', RESOLVED: 'Đã giải quyết', CLOSED: 'Đã đóng',
};

const CHAT_STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const BUBBLE_CONFIG = {
    USER:       { align: 'mr-auto',                  bubble: 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm', nameColor: 'text-slate-500' },
    PHARMACIST: { align: 'ml-auto flex-row-reverse', bubble: 'bg-[#EBF0FF] border border-blue-100 text-slate-800 rounded-tr-none', nameColor: 'text-[#3C50E0]' },
    BOT:        { align: 'mr-auto',                  bubble: 'bg-slate-50 border border-slate-200 text-slate-600 rounded-tl-none italic', nameColor: 'text-slate-400' },
    ADMIN:      { align: 'mr-auto',                  bubble: 'bg-purple-50 border border-purple-100 text-slate-800 rounded-tl-none', nameColor: 'text-purple-500' },
};

const MessageBubble = ({ msg }) => {
    const cfg = BUBBLE_CONFIG[msg.senderRole] || BUBBLE_CONFIG.BOT;
    const isRight = msg.senderRole === 'PHARMACIST';
    const time = msg.createdAt
        ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : '';

    return (
        <div className={`flex gap-2 max-w-[80%] ${cfg.align}`}>
            {!isRight && (
                <div className="w-7 h-7 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-500 mt-1">
                    {msg.senderRole === 'BOT' ? 'B' : (msg.senderDisplayName?.charAt(0)?.toUpperCase() || 'U')}
                </div>
            )}
            <div className="flex flex-col gap-0.5">
                {!isRight && (
                    <span className={`text-[10px] font-semibold ${cfg.nameColor} px-1`}>
                        {msg.senderDisplayName || msg.senderRole}
                    </span>
                )}
                <div className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${cfg.bubble}`}>
                    {msg.messageType === 'IMAGE' && msg.fileUrl ? (
                        <img src={msg.fileUrl} alt={msg.fileName || 'image'} className="max-w-[200px] rounded-lg" />
                    ) : msg.messageType === 'FILE' && msg.fileUrl ? (
                        <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="underline text-blue-600 text-xs">
                            📎 {msg.fileName || 'File'}
                        </a>
                    ) : msg.content}
                </div>
                <span className={`text-[10px] text-slate-400 px-1 ${isRight ? 'text-right' : 'text-left'}`}>{time}</span>
            </div>
        </div>
    );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ConversationDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);

    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [msgLoading, setMsgLoading] = useState(false);
    const [wsReady, setWsReady] = useState(false);
    const [resolving, setResolving] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const messagesEndRef = useRef(null);
    const subConvRef = useRef(null);
    const subErrRef = useRef(null);

    const isOwner = conversation?.pharmacistId === user?.id;
    const canSend = isOwner && conversation?.status === 'IN_PROGRESS' && wsReady;

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const unwrapConversationPage = (response) => {
        const result = response?.data?.result;
        if (Array.isArray(result)) return result;
        return result?.content || [];
    };

    const findConversationById = useCallback(async (conversationId) => {
        const responses = await Promise.all(
            CHAT_STATUSES.map((status) =>
                status === 'PENDING'
                    ? chatService.getWaitingConversations(0, 100)
                    : chatService.getConversations({ status, page: 0, size: 100 })
            )
        );

        return responses
            .flatMap(unwrapConversationPage)
            .find((item) => item?.id === conversationId) || null;
    }, []);

    // ── Load conversation info + messages ─────────────────────────────────────
    useEffect(() => {
        if (!id) return;
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [msgRes, foundConversation] = await Promise.all([
                chatService.getMessages(id, 0, 50),
                findConversationById(id),
            ]);
            const msgs = msgRes.data?.result?.content || [];
            setMessages(msgs);
            setTotalPages(msgRes.data?.result?.totalPages || 0);
            setConversation(foundConversation || {
                id,
                status: msgs.length ? 'IN_PROGRESS' : 'PENDING',
                userDisplayName: msgs.find(m => m.senderRole === 'USER')?.senderDisplayName,
                pharmacistId: null,
                lastMessageAt: msgs[msgs.length - 1]?.createdAt,
            });
        } catch (e) {
            console.error(e);
            toast.error('Không tải được dữ liệu hội thoại');
        } finally {
            setLoading(false);
        }
    };

    const loadMoreMessages = async () => {
        if (page + 1 >= totalPages) return;
        setMsgLoading(true);
        try {
            const res = await chatService.getMessages(id, page + 1, 50);
            const older = res.data?.result?.content || [];
            setMessages(prev => [...older, ...prev]);
            setPage(p => p + 1);
        } catch (e) {
            toast.error('Không tải thêm được tin nhắn');
        } finally {
            setMsgLoading(false);
        }
    };

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    // ── WebSocket ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!id) return;

        const setup = () => {
            subConvRef.current?.unsubscribe?.();

            subConvRef.current = subscribeConversation(id, (msg) => {
                // Nhận cả conversation update (khi status thay đổi) và message mới
                if (msg.status !== undefined) {
                    // Đây là ConversationResponse (status update)
                    setConversation(msg);
                } else {
                    // Đây là MessageResponse
                    setMessages(prev => {
                        if (prev.some(m => m.id === msg.id)) return prev;
                        return [...prev, msg];
                    });
                }
            });
        };

        if (isConnected()) {
            setWsReady(true);
            setup();
        } else {
            connectSocket({
                onConnect: () => {
                    setWsReady(true);
                    setup();
                    subErrRef.current = subscribeErrors((err) => {
                        toast.error(err.message || 'Lỗi WebSocket');
                    });
                },
                onDisconnect: () => setWsReady(false),
                onError: () => setWsReady(false),
            });
        }

        return () => {
            subConvRef.current?.unsubscribe?.();
            subErrRef.current?.unsubscribe?.();
        };
    }, [id]);

    // ── Send message ──────────────────────────────────────────────────────────
    const handleSend = (e) => {
        e.preventDefault();
        const text = inputText.trim();
        if (!text || !canSend) return;
        const ok = sendMessage({ conversationId: id, messageType: 'TEXT', content: text });
        if (ok) setInputText('');
        else toast.error('Chưa kết nối WebSocket');
    };

    // ── Resolve ───────────────────────────────────────────────────────────────
    const handleResolve = async () => {
        if (!isOwner || conversation?.status !== 'IN_PROGRESS') return;
        setResolving(true);
        try {
            const res = await chatService.resolveConversation(id);
            const updated = res.data?.result;
            setConversation(updated);
            toast.success('Đã hoàn tất tư vấn');
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Không thể hoàn tất tư vấn');
        } finally {
            setResolving(false);
        }
    };

    const formatDateTime = (d) => d ? new Date(d).toLocaleString('vi-VN') : '—';

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F1F5F9] text-[#1C2434] font-satoshi">
            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>

            {/* Breadcrumb */}
            <div className="mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/pharmacist/conversations')}
                        className="flex items-center gap-1 text-[#64748B] hover:text-[#1C2434] text-xs transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Quay lại
                    </button>
                    <span className="text-[#64748B] text-xs">/</span>
                    <h2 className="text-xl font-bold text-[#1C2434]">Chi tiết hội thoại</h2>
                </div>
                <p className="text-xs text-[#64748B]">Home &gt; Hội thoại &gt; Chi tiết</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* LEFT — Info panel */}
                <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0] p-4 flex flex-col gap-3 h-fit">
                    <h3 className="text-sm font-bold text-[#1C2434] border-b border-[#E2E8F0] pb-2">Thông tin hội thoại</h3>

                    {loading ? (
                        <div className="text-center py-4">
                            <div className="animate-spin inline-block w-4 h-4 border-2 border-[#3C50E0] border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-[#64748B]">Trạng thái</span>
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_BADGE[conversation?.status] || STATUS_BADGE.PENDING}`}>
                                        {STATUS_LABEL[conversation?.status] || conversation?.status || '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#64748B]">Khách hàng</span>
                                    <span className="font-medium text-[#1C2434]">{conversation?.userDisplayName || messages[0]?.senderDisplayName || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#64748B]">Dược sĩ phụ trách</span>
                                    <span className="font-medium text-[#1C2434]">
                                        {isOwner ? `${user?.username} (bạn)` : (conversation?.pharmacistId ? 'Dược sĩ khác' : '—')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#64748B]">Thời gian tạo</span>
                                    <span className="font-medium text-[#1C2434]">{formatDateTime(conversation?.createdAt)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#64748B]">Tin nhắn cuối</span>
                                    <span className="font-medium text-[#1C2434]">{formatDateTime(conversation?.lastMessageAt)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#64748B]">ID</span>
                                    <span className="text-[10px] text-[#8A99AD] truncate max-w-[120px]">{id}</span>
                                </div>
                            </div>

                            {/* WS indicator */}
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium border ${wsReady ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${wsReady ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                                {wsReady ? 'Realtime active' : 'Đang kết nối...'}
                            </div>

                            {/* Resolve button — chỉ hiện nếu là owner và IN_PROGRESS */}
                            {isOwner && conversation?.status === 'IN_PROGRESS' && (
                                <button
                                    onClick={handleResolve}
                                    disabled={resolving}
                                    className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-60"
                                >
                                    <CheckCircle size={14} />
                                    {resolving ? 'Đang xử lý...' : 'Hoàn tất tư vấn'}
                                </button>
                            )}

                            {!isOwner && conversation?.status === 'IN_PROGRESS' && (
                                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-700 text-center">
                                    Hội thoại này đang được dược sĩ khác phụ trách.<br />Bạn chỉ có thể xem.
                                </div>
                            )}

                            {conversation?.status === 'RESOLVED' && (
                                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-700 text-center">
                                    Đã giải quyết. Nếu khách nhắn tiếp, hội thoại sẽ chuyển sang PENDING.
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* RIGHT — Chat panel */}
                <div
                    style={{ borderRadius: '1rem', height: '600px' }}
                    className="lg:col-span-2 bg-white border border-[#E2E8F0] flex flex-col"
                >
                    {/* Chat header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] flex-shrink-0">
                        <h3 className="text-sm font-bold text-[#1C2434]">Lịch sử tin nhắn</h3>
                        {page + 1 < totalPages && (
                            <button
                                onClick={loadMoreMessages}
                                disabled={msgLoading}
                                className="text-xs text-[#3C50E0] hover:underline disabled:opacity-50"
                            >
                                {msgLoading ? 'Đang tải...' : 'Xem thêm tin nhắn cũ'}
                            </button>
                        )}
                    </div>

                    {/* Messages area */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-4 bg-[#F8FAFC] space-y-3">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="animate-spin w-6 h-6 border-[2.5px] border-[#3C50E0] border-t-transparent rounded-full" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-2 text-[#64748B]">
                                <svg className="w-10 h-10 text-[#CBD5E1]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="text-xs">Chưa có tin nhắn nào</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <MessageBubble key={msg.id || idx} msg={msg} />
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* CLOSED / RESOLVED notice */}
                    {(conversation?.status === 'CLOSED' || conversation?.status === 'RESOLVED') && (
                        <div className="px-4 py-2 bg-gray-50 border-t border-[#E2E8F0] text-center text-[11px] text-[#64748B] flex-shrink-0">
                            {conversation.status === 'CLOSED'
                                ? 'Hội thoại đã đóng — không thể gửi thêm tin nhắn.'
                                : 'Tư vấn đã hoàn tất — chờ phản hồi từ khách hàng.'}
                        </div>
                    )}

                    {/* Input — chỉ hiện nếu là owner và IN_PROGRESS */}
                    {canSend && (
                        <form
                            onSubmit={handleSend}
                            className="flex items-center gap-2 px-3 py-2 border-t border-[#E2E8F0] bg-white flex-shrink-0"
                        >
                            <input
                                type="text"
                                placeholder="Nhập nội dung tư vấn..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-4 py-2 text-xs text-[#1C2434] placeholder-[#8A99AD] focus:outline-none focus:border-[#3C50E0] transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!inputText.trim()}
                                className="flex items-center justify-center w-9 h-9 rounded-full bg-[#3C50E0] text-white hover:bg-opacity-90 transition-all disabled:opacity-40"
                            >
                                <Send size={15} />
                            </button>
                        </form>
                    )}

                    {/* Read-only notice for non-owner pharmacist */}
                    {!isOwner && conversation?.status === 'IN_PROGRESS' && (
                        <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 text-center text-[11px] text-amber-600 flex-shrink-0">
                            Chế độ xem — bạn không phải dược sĩ phụ trách hội thoại này
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
