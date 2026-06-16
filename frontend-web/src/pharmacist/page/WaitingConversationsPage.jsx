import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Send, Search, MessageSquare, Wifi, WifiOff, MoreHorizontal, Paperclip, Loader2 } from 'lucide-react';
import chatService from '../../services/chat/chatService';
import {
    connectSocket,
    subscribeConversation,
    subscribeInbox,
    subscribeErrors,
    sendMessage,
    markAsReadWs,
    isConnected,
} from '../../services/chat/chatSocket';
import {
    setConversations,
    setMessages,
    setActiveConversationId,
    upsertConversation,
    resetUnread,
    appendMessageToInbox,
} from '../../redux/slices/chatSlice';
import fileUploadService from '../../admin/service/fileUploadService';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatTime = (t) => {
    if (!t) return '';
    const d = new Date(t);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const isThisYear = d.getFullYear() === now.getFullYear();
    return isThisYear
        ? d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
        : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const getInitial = (name) => (name || '?').charAt(0).toUpperCase();

const AVATAR_COLORS = [
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
    'bg-rose-500', 'bg-amber-500', 'bg-cyan-500',
];
const getAvatarColor = (id = '') => {
    const idx = (id.charCodeAt(0) || 0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
};

// ─────────────────────────────────────────────────────────────────────────────
// Message Bubble
// ─────────────────────────────────────────────────────────────────────────────
const BUBBLE = {
    USER: { wrap: 'mr-auto', box: 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm', name: 'text-slate-500' },
    PHARMACIST: { wrap: 'ml-auto flex-row-reverse', box: 'bg-[#3C50E0] text-white rounded-tr-none', name: '' },
    ADMIN: { wrap: 'ml-auto flex-row-reverse', box: 'bg-violet-600 text-white rounded-tr-none', name: '' },
    BOT: { wrap: 'mr-auto', box: 'bg-slate-100 border border-slate-200 text-slate-600 rounded-tl-none italic', name: 'text-slate-400' },
};

const MessageBubble = ({ msg }) => {
    const isRight = msg.senderRole === 'PHARMACIST' || msg.senderRole === 'ADMIN';
    const cfg = BUBBLE[msg.senderRole] || BUBBLE.BOT;
    const time = msg.createdAt
        ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : '';

    // Hàm xử lý tải ảnh/file an toàn bằng cơ chế Blob (Vượt lỗi chặn CORS từ Cloud)
    const handleDownload = async (e, fileUrl, fileName) => {
        e.preventDefault(); // Ngăn chặn hành vi mở link trực tiếp của thẻ <a>

        try {
            // Hiển thị loading toast thông báo cho Dược sĩ/Admin biết hệ thống đang tải tin
            toast.loading('Đang chuẩn bị tải tệp xuống...', { id: 'download-toast', duration: 2000 });

            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error('Network response was not ok');

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName || 'download-file';

            document.body.appendChild(link);
            link.click();

            // Xóa phần tử nhúng và giải phóng bộ nhớ tạm thời của trình duyệt
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            toast.success('Tải về thành công!', { id: 'download-toast' });
        } catch (error) {
            console.error('[Download Error]:', error);
            toast.error('Không thể tải file tự động, đang mở liên kết trực tiếp...', { id: 'download-toast' });

            // Fallback (Dự phòng): Mở tab mới nếu cấu hình CORS chặn tải ngầm để Admin chủ động lưu chuột phải
            window.open(fileUrl, '_blank');
        }
    };

    return (
        <div className={`flex gap-2 max-w-[75%] ${cfg.wrap}`}>
            {!isRight && (
                <div className="w-7 h-7 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-500 mt-1">
                    {msg.senderRole === 'BOT' ? 'B' : getInitial(msg.senderDisplayName)}
                </div>
            )}
            <div className="flex flex-col gap-0.5 max-w-full">
                {!isRight && msg.senderDisplayName && (
                    <span className={`text-[10px] font-semibold px-1 ${cfg.name} text-start`}>{msg.senderDisplayName}</span>
                )}
                <div className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed break-words ${cfg.box}`}>
                    {msg.messageType === 'IMAGE' && msg.fileUrl ? (
                        <div className="relative group cursor-pointer">
                            <img
                                src={msg.fileUrl}
                                alt={msg.fileName || 'Hình ảnh'}
                                onClick={(e) => handleDownload(e, msg.fileUrl, msg.fileName || 'image-download.png')}
                                className="max-w-full sm:max-w-[240px] rounded-lg object-cover shadow-sm transition-opacity group-hover:opacity-85"
                                title="Nhấp để tải ảnh này về"
                            />
                        </div>
                    ) : msg.messageType === 'FILE' && msg.fileUrl ? (
                        <a
                            href={msg.fileUrl}
                            onClick={(e) => handleDownload(e, msg.fileUrl, msg.fileName || 'document-file')}
                            className={`underline text-xs flex items-center gap-1 font-medium ${isRight ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}
                            title="Nhấp để tải tệp đính kèm này về"
                        >
                            📎 {msg.fileName || 'File đính kèm'}
                        </a>
                    ) : (
                        msg.content
                    )}
                </div>
                <span className={`text-[10px] text-slate-400 px-1 ${isRight ? 'text-right' : 'text-left'}`}>{time}</span>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// ConversationItem — sidebar item
// ─────────────────────────────────────────────────────────────────────────────
const ConversationItem = ({ conv, isActive, onClick }) => {
    const hasUnread = conv.unreadCount > 0;

    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-3 py-3 flex items-start gap-3 transition-all border-b border-slate-100
                ${isActive ? 'bg-[#EBF0FF]' : 'hover:bg-slate-50'}
            `}
        >
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-sm
                ${getAvatarColor(conv.id)}
            `}>
                {conv.userAvatarUrl
                    ? <img src={conv.userAvatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    : getInitial(conv.userDisplayName)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={`text-sm truncate ${hasUnread ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>
                        {conv.userDisplayName || 'Khách hàng'}
                    </span>
                    <span className={`text-[10px] flex-shrink-0 ${hasUnread ? 'text-[#3C50E0] font-semibold' : 'text-slate-400'}`}>
                        {formatTime(conv.lastMessageAt)}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <p className={`text-[11px] truncate flex-1 ${hasUnread ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                        {conv.lastMessageContent
                            ? (conv.lastMessageSenderRole === 'PHARMACIST' || conv.lastMessageSenderRole === 'ADMIN'
                                ? `Bạn: ${conv.lastMessageContent}`
                                : conv.lastMessageContent)
                            : 'Chưa có tin nhắn'}
                    </p>
                    {hasUnread && (
                        <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 bg-[#3C50E0] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function WaitingConversationsPage() {
    const dispatch = useDispatch();
    const { conversations, activeConversationId, messages } = useSelector(s => s.chat);

    const [searchQuery, setSearchQuery] = useState('');
    const [inputText, setInputText] = useState('');
    const [wsReady, setWsReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [msgLoading, setMsgLoading] = useState(false);
    const [uploading, setUploading] = useState(false); // Quản lý trạng thái upload ảnh/file
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const messagesEndRef = useRef(null);
    const subInboxRef = useRef(null);
    const subConvRef = useRef(null);
    const subErrRef = useRef(null);
    const activeIdRef = useRef(null);
    const fileInputRef = useRef(null); // Ref kết nối thẻ input chọn file

    const activeConv = conversations.find(c => c.id === activeConversationId) || null;

    // ── Scroll to bottom ──────────────────────────────────────────────────────
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    // ── WebSocket setup ───────────────────────────────────────────────────────
    useEffect(() => {
        const setupWs = () => {
            setWsReady(true);

            // Subscribe shared inbox — nhận ConversationResponse khi có tin mới
            subInboxRef.current?.unsubscribe?.();
            subInboxRef.current = subscribeInbox((updatedConv) => {
                dispatch(upsertConversation(updatedConv));
            });

            subErrRef.current = subscribeErrors(err => {
                toast.error(err.message || 'Lỗi WebSocket');
            });
        };

        if (isConnected()) {
            setupWs();
        } else {
            connectSocket({
                onConnect: setupWs,
                onDisconnect: () => setWsReady(false),
                onError: () => setWsReady(false),
            });
        }

        return () => {
            subInboxRef.current?.unsubscribe?.();
            subConvRef.current?.unsubscribe?.();
            subErrRef.current?.unsubscribe?.();
        };
    }, [dispatch]);

    // ── Load initial conversation list ────────────────────────────────────────
    useEffect(() => {
        loadConversations(0);
    }, []);

    const loadConversations = async (p = 0) => {
        try {
            setLoading(true);
            const res = await chatService.getAllConversations(p, 20);
            const result = res.data?.result;
            if (p === 0) {
                dispatch(setConversations(result?.content || []));
            } else {
                dispatch(setConversations([...conversations, ...(result?.content || [])]));
            }
            setTotalPages(result?.totalPages || 0);
            setPage(p);
        } catch (e) {
            toast.error('Không tải được danh sách hội thoại');
        } finally {
            setLoading(false);
        }
    };

    // ── Select conversation ───────────────────────────────────────────────────
    const selectConversation = useCallback(async (conv) => {
        if (activeIdRef.current === conv.id) return;

        dispatch(setActiveConversationId(conv.id));
        activeIdRef.current = conv.id;
        dispatch(setMessages([]));

        // Unsubscribe conversation cũ
        subConvRef.current?.unsubscribe?.();

        // Load messages
        setMsgLoading(true);
        try {
            const res = await chatService.getMessages(conv.id, 0, 50);
            dispatch(setMessages(res.data?.result?.content || []));
        } catch (e) {
            toast.error('Không tải được tin nhắn');
        } finally {
            setMsgLoading(false);
        }

        // Subscribe conversation topic
        if (isConnected()) {
            subConvRef.current = subscribeConversation(conv.id, (msg) => {
                if (activeIdRef.current === msg.conversationId) {
                    dispatch(appendMessageToInbox(msg));
                }
            });
        }

        // Mark as read: reset unreadCount
        if (conv.unreadCount > 0) {
            dispatch(resetUnread(conv.id));
            markAsReadWs(conv.id);
            chatService.markAsRead(conv.id).catch(() => { });
        }
    }, [dispatch]);

    // ── Send message ──────────────────────────────────────────────────────────
    const handleSend = useCallback((e) => {
        e?.preventDefault();
        const text = inputText.trim();
        if (!text || !wsReady || !activeConversationId) return;

        const ok = sendMessage({
            conversationId: activeConversationId,
            messageType: 'TEXT',
            content: text,
        });
        if (ok) setInputText('');
        else toast.error('Chưa kết nối WebSocket');
    }, [inputText, wsReady, activeConversationId]);

    // ── Hàm xử lý tải ảnh lên và gửi WebSocket ──────────────────────────────────
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !activeConversationId) return;

        if (!wsReady) {
            toast.error('Đang mất kết nối kết nối, vui lòng thử lại sau');
            return;
        }

        const isImage = file.type.startsWith('image/');
        const msgType = isImage ? 'IMAGE' : 'FILE';

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            // Gọi API uploadImage của bạn
            const res = await fileUploadService.uploadImage(formData);

            // Xử lý lấy linh hoạt URL từ object trả về
            const finalData = res.data?.result || res.data;
            const fileUrl = finalData?.fileUrl || finalData?.url || finalData;

            if (fileUrl && typeof fileUrl === 'string') {
                // Upload thành công -> Bắn tin nhắn qua WS lên Backend
                const ok = sendMessage({
                    conversationId: activeConversationId,
                    messageType: msgType,
                    content: isImage ? 'Đã gửi một hình ảnh' : `Đã gửi tệp: ${file.name}`,
                    fileUrl: fileUrl,
                    fileName: finalData?.fileName || file.name,
                });

                if (!ok) {
                    toast.error('Gửi gói tin đính kèm thất bại qua WebSocket');
                }
            } else {
                toast.error('Không tìm thấy đường dẫn file từ kết quả trả về');
            }
        } catch (error) {
            console.error('[Upload Error]:', error);
            toast.error('Tải tập tin lên thất bại');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Xóa tệp cũ trong input để lần sau chọn lại tệp cũ vẫn ăn event change
        }
    };

    const triggerFileInput = () => {
        if (!wsReady) {
            toast.error('Vui lòng đợi kết nối ổn định');
            return;
        }
        fileInputRef.current?.click();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    // ── Filter ────────────────────────────────────────────────────────────────
    const filteredConversations = searchQuery.trim()
        ? conversations.filter(c =>
            c.userDisplayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.lastMessageContent?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : conversations;

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    return (
        <div className="min-h-screen bg-[#F1F5F9] text-[#1C2434] font-satoshi p-0">
            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>

            {/* Input File ẩn hỗ trợ đầy đủ ảnh và file văn bản */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            />

            {/* Page header */}
            <div className="flex items-center justify-between ">
                <div>
                    <h2 className="text-xl font-bold text-[#1C2434] flex items-center gap-2">
                        Hộp thư tư vấn
                        {totalUnread > 0 && (
                            <span className="px-2 py-0.5 bg-[#3C50E0] text-white text-xs font-bold rounded-full">
                                {totalUnread}
                            </span>
                        )}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border
                        ${wsReady ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}
                    `}>
                        {wsReady ? <Wifi size={11} /> : <WifiOff size={11} />}
                        {wsReady ? 'Realtime' : 'Đang kết nối'}
                    </span>
                </div>
            </div>

            {/* Chat layout */}
            <div
                style={{ borderRadius: '1rem', height: 'calc(100vh - 140px)', minHeight: '450px' }}
                className="flex overflow-hidden border border-[#E2E8F0] bg-white shadow-sm"
            >
                {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
                <div className="w-72 flex-shrink-0 flex flex-col border-r border-[#E2E8F0]">
                    {/* Search */}
                    <div className="p-3 border-b border-[#E2E8F0]">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Tìm khách hàng..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-full pl-8 pr-3 py-1.5 text-xs text-[#1C2434] placeholder-slate-400 focus:outline-none focus:border-[#3C50E0] transition-all"
                            />
                        </div>
                    </div>

                    {/* Conversation list */}
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {loading && conversations.length === 0 ? (
                            <div className="p-8 flex flex-col items-center gap-2 text-slate-400">
                                <div className="animate-spin w-5 h-5 border-2 border-[#3C50E0] border-t-transparent rounded-full" />
                                <p className="text-xs">Đang tải...</p>
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="p-8 flex flex-col items-center gap-2 text-slate-400">
                                <MessageSquare size={28} className="text-slate-200" />
                                <p className="text-xs text-center">
                                    {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có hội thoại nào'}
                                </p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => (
                                <ConversationItem
                                    key={conv.id}
                                    conv={conv}
                                    isActive={activeConversationId === conv.id}
                                    onClick={() => selectConversation(conv)}
                                />
                            ))
                        )}

                        {/* Load more */}
                        {page + 1 < totalPages && !loading && (
                            <button
                                onClick={() => loadConversations(page + 1)}
                                className="w-full py-2 text-[11px] text-[#3C50E0] hover:bg-slate-50 transition-all text-center"
                            >
                                Tải thêm...
                            </button>
                        )}
                    </div>
                </div>

                {/* ── CHAT AREA ─────────────────────────────────────────────────── */}
                <div className="flex-1 flex flex-col min-w-0 relative">
                    {activeConv ? (
                        <>
                            {/* Chat header */}
                            <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between flex-shrink-0 bg-white">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-sm ${getAvatarColor(activeConv.id)}`}>
                                        {activeConv.userAvatarUrl
                                            ? <img src={activeConv.userAvatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                            : getInitial(activeConv.userDisplayName)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-[#1C2434]">
                                            {activeConv.userDisplayName || 'Khách hàng'}
                                        </p>
                                    </div>
                                </div>
                                <button className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                                    <MoreHorizontal size={16} />
                                </button>
                            </div>

                            {/* Chỉ báo trạng thái đang tải file */}
                            {uploading && (
                                <div className="absolute top-[53px] left-0 right-0 z-10 px-4 py-1.5 bg-blue-50 border-b border-blue-100 text-[11px] text-blue-600 flex items-center gap-2 shadow-sm animate-fadeIn">
                                    <Loader2 size={13} className="animate-spin text-blue-500" />
                                    <span>Hệ thống đang tải tệp tin lên và gửi đi... Vui lòng đợi trong giây lát.</span>
                                </div>
                            )}

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto no-scrollbar p-4 bg-[#F8FAFC] space-y-3">
                                {msgLoading ? (
                                    <div className="flex justify-center items-center h-full">
                                        <div className="animate-spin w-6 h-6 border-2 border-[#3C50E0] border-t-transparent rounded-full" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                                        <MessageSquare size={32} className="text-slate-200" />
                                        <p className="text-sm">Chưa có tin nhắn nào</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => (
                                        <MessageBubble key={msg.id || idx} msg={msg} />
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input form */}
                            <form
                                onSubmit={handleSend}
                                className="flex items-center gap-2 px-4 py-3 border-t border-[#E2E8F0] bg-white flex-shrink-0"
                            >
                                {/* Nút Đính Kèm Ảnh/File */}
                                <button
                                    type="button"
                                    onClick={triggerFileInput}
                                    disabled={uploading || !wsReady}
                                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all flex-shrink-0 disabled:opacity-40"
                                    title="Gửi hình ảnh hoặc tệp tin"
                                >
                                    <Paperclip size={18} />
                                </button>

                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={wsReady ? `Trả lời ${activeConv.userDisplayName || 'khách hàng'}...` : 'Đang kết nối...'}
                                    disabled={!wsReady || uploading}
                                    className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-4 py-2 text-sm text-[#1C2434] placeholder-slate-400 focus:outline-none focus:border-[#3C50E0] disabled:opacity-50 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputText.trim() || !wsReady || uploading}
                                    className="w-10 h-10 flex-shrink-0 rounded-full bg-[#3C50E0] text-white flex items-center justify-center hover:bg-opacity-90 transition-all disabled:opacity-40"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </>
                    ) : (
                        /* Empty state */
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center bg-[#F8FAFC]">
                            <div className="w-16 h-16 rounded-full bg-[#EBF0FF] flex items-center justify-center">
                                <MessageSquare size={28} className="text-[#3C50E0]" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#1C2434]">Chọn một hội thoại</h3>
                                <p className="text-xs text-[#64748B] mt-1">
                                    Chọn khách hàng từ danh sách bên trái để bắt đầu tư vấn
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}