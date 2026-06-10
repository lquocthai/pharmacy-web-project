import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Paperclip, RefreshCw, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import chatAvatar from '../../assets/avatar-chat.png';
import chatIcon from '../../assets/chat.png';
import { openLoginModal } from '../../redux/slices/authSlice';
import {
    openChat, closeChat, toggleChat,
    setConversation, setMessages, appendMessage,
} from '../../redux/slices/chatSlice';
import chatService from '../../services/chat/chatService';
import {
    connectSocket,
    disconnectSocket,
    subscribeConversation,
    subscribeErrors,
    sendMessage,
    isConnected,
} from '../../services/chat/chatSocket';
import FileUploadService from '../../admin/service/fileUploadService'

// ─────────────────────────────────────────────────────────────────────────────
// Message Bubble
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Message Bubble (Hỗ trợ Click tự động Tải Xuống)
// ─────────────────────────────────────────────────────────────────────────────
const BUBBLE = {
    USER: { wrap: 'ml-auto flex-row-reverse text-end', box: 'bg-blue-600 text-white rounded-tr-none', name: '' },
    PHARMACIST: { wrap: 'mr-auto text-start', box: 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm', name: 'text-emerald-600' },
    BOT: { wrap: 'mr-auto', box: 'bg-slate-100 border border-slate-200 text-slate-700 rounded-tl-none italic', name: 'text-slate-400' },
    ADMIN: { wrap: 'mr-auto', box: 'bg-purple-50 border border-purple-100 text-slate-800 rounded-tl-none', name: 'text-purple-500' },
};

const MessageBubble = ({ msg }) => {
    const isMine = msg.senderRole === 'USER';
    const cfg = BUBBLE[msg.senderRole] || BUBBLE.BOT;
    const time = msg.createdAt
        ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : '';

    // Hàm xử lý tải file an toàn, tránh bị trình duyệt chặn mở tab mới do cơ chế CORS
    const handleDownload = async (e, fileUrl, fileName) => {
        e.preventDefault(); // Chặn hành vi mở link mặc định của thẻ <a>
        try {
            toast.loading('Đang chuẩn bị tải tệp xuống...', { id: 'download-toast', duration: 1500 });

            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName || 'downloaded-file';

            document.body.appendChild(link);
            link.click();

            // Dọn dẹp bộ nhớ sau khi tải xong
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            toast.success('Tải về thành công!', { id: 'download-toast' });
        } catch (error) {
            console.error('Lỗi khi tải file:', error);
            toast.error('Không thể tải file trực tiếp, đang thử mở liên kết...', { id: 'download-toast' });
            // Cứu cánh: Nếu lỗi CORS không tải ngầm được thì mở thẳng tab mới cho user lưu thủ công
            window.open(fileUrl, '_blank');
        }
    };

    return (
        <div className={`flex gap-2 max-w-[85%] ${cfg.wrap}`}>
            {!isMine && (
                <div className="w-7 h-7 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs overflow-hidden mt-1">
                    {msg.senderRole === 'BOT'
                        ? <img src={chatAvatar} alt="bot" className="w-full h-full object-cover" />
                        : <span className="text-[10px] font-bold text-slate-600">
                            {msg.senderRole === 'PHARMACIST' ? 'DS' : 'AD'}
                        </span>}
                </div>
            )}
            <div className="flex flex-col gap-0.5">
                {!isMine && msg.senderDisplayName && (
                    <span className={`text-start text-[10px] font-semibold px-1 ${cfg.name}`}>
                        {msg.senderDisplayName}
                    </span>
                )}

                {/* Hộp thoại hiển thị nội dung tin nhắn / ảnh / file */}
                <div className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed break-words ${cfg.box}`}>
                    {msg.messageType === 'IMAGE' && msg.fileUrl ? (
                        <div className="relative group cursor-pointer">
                            <img
                                src={msg.fileUrl}
                                alt={msg.fileName || 'Hình ảnh'}
                                onClick={(e) => handleDownload(e, msg.fileUrl, msg.fileName || 'vnpay-image.png')}
                                className="max-w-full sm:max-w-[200px] rounded-lg object-cover transition-opacity group-hover:opacity-80"
                                title="Nhấp để tải ảnh về máy"
                            />
                        </div>
                    ) : msg.messageType === 'FILE' && msg.fileUrl ? (
                        <a
                            href={msg.fileUrl}
                            onClick={(e) => handleDownload(e, msg.fileUrl, msg.fileName || 'attachment-file')}
                            className={`underline text-xs flex items-center gap-1 font-medium ${isMine ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}
                            title="Nhấp để tải tài liệu về máy"
                        >
                            📎 {msg.fileName || 'File đính kèm'}
                        </a>
                    ) : (
                        msg.content
                    )}
                </div>
                <span className={`text-[10px] text-slate-400 px-1 ${isMine ? 'text-right' : 'text-left'}`}>{time}</span>
            </div>
        </div>
    );
};
// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ChatAdvisor() {
    const { isAuthenticated } = useSelector(s => s.auth);
    const { isChatOpen, conversation, messages } = useSelector(s => s.chat);
    const dispatch = useDispatch();

    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [wsReady, setWsReady] = useState(false);
    const [wsError, setWsError] = useState(false);
    const [hasNewMessage, setHasNewMessage] = useState(false);

    const messagesEndRef = useRef(null);
    const subConvRef = useRef(null);
    const subErrRef = useRef(null);
    const convIdRef = useRef(null);
    const fileInputRef = useRef(null);
    const isChatOpenRef = useRef(isChatOpen);

    useEffect(() => {
        isChatOpenRef.current = isChatOpen;
        if (isChatOpen) {
            setHasNewMessage(false);
        }
    }, [isChatOpen]);

    // ── Scroll to bottom ──────────────────────────────────────────────────────
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (isChatOpen) scrollToBottom();
    }, [messages, isChatOpen, scrollToBottom]);

    // ── WebSocket connect ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated) return;

        connectSocket({
            onConnect: () => {
                setWsReady(true);
                setWsError(false);
                subErrRef.current = subscribeErrors(err => {
                    toast.error(err.message || 'Lỗi kết nối');
                });
            },
            onDisconnect: () => setWsReady(false),
            onError: () => { setWsReady(false); setWsError(true); },
        });

        return () => {
            subErrRef.current?.unsubscribe?.();
            subConvRef.current?.unsubscribe?.();
            disconnectSocket();
        };
    }, [isAuthenticated]);

    // ── Subscribe conversation topic ──────────────────────────────────────────
    useEffect(() => {
        if (!conversation?.id || !wsReady) return;

        subConvRef.current?.unsubscribe?.();
        convIdRef.current = conversation.id;

        subConvRef.current = subscribeConversation(conversation.id, (msg) => {
            dispatch(appendMessage(msg));

            // Nếu có tin nhắn mới mà ô chat đang ĐÓNG và không phải do chính USER gửi -> Bật chấm cam
            if (!isChatOpenRef.current && msg.senderRole !== 'USER') {
                setHasNewMessage(true);
            }
        });

        return () => { subConvRef.current?.unsubscribe?.(); };
    }, [conversation?.id, wsReady, dispatch]);

    // ── Load conversation khi mở chat ─────────────────────────────────────────
    useEffect(() => {
        if (!isChatOpen || !isAuthenticated) return;
        loadMyConversation();
    }, [isChatOpen, isAuthenticated]);

    const loadMyConversation = async () => {
        try {
            setLoading(true);
            const res = await chatService.getMyConversation();
            const conv = res.data?.result;
            dispatch(setConversation(conv || null));

            if (conv?.id) {
                const msgRes = await chatService.getMessages(conv.id, 0, 50);
                dispatch(setMessages(msgRes.data?.result?.content || []));
            } else {
                dispatch(setMessages([]));
            }
        } catch (e) {
            console.error('[Chat] loadMyConversation error:', e);
        } finally {
            setLoading(false);
        }
    };

    const checkAndReloadIfFirstMsg = () => {
        if (!convIdRef.current) {
            setTimeout(loadMyConversation, 1000);
        }
    };

    // ── Send message ──────────────────────────────────────────────────────────
    const handleSend = useCallback((e) => {
        e?.preventDefault();
        const text = inputText.trim();
        if (!text || !wsReady) {
            if (!wsReady) toast.error('Đang kết nối, thử lại sau...');
            return;
        }

        const ok = sendMessage({
            conversationId: convIdRef.current || null,
            messageType: 'TEXT',
            content: text,
        });

        if (ok) {
            setInputText('');
            checkAndReloadIfFirstMsg();
        } else {
            toast.error('Chưa kết nối WebSocket, vui lòng thử lại');
        }
    }, [inputText, wsReady]);

    // ── Gọi API uploadImage & gửi tin nhắn chứa link file qua WS ───────────────
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!wsReady) {
            toast.error('Chưa kết nối WebSocket, vui lòng đợi...');
            return;
        }

        const isImage = file.type.startsWith('image/');
        const msgType = isImage ? 'IMAGE' : 'FILE';

        try {
            setUploading(true);

            const formData = new FormData();
            formData.append('file', file);

            // Gọi chuẩn xác hàm chatService.uploadImage của bạn
            const res = await FileUploadService.uploadImage(formData);

            // Check linh hoạt cấu trúc response trả về (bọc qua .result hoặc trực tiếp trong .data)
            const finalData = res.data?.result || res.data;
            // Lấy URL trả về (thường là url, fileUrl, hoặc đường dẫn chuỗi trực tiếp)
            const fileUrl = finalData?.fileUrl || finalData?.url || finalData;

            if (fileUrl && typeof fileUrl === 'string') {
                // Upload hoàn tất -> Gửi gói tin đính kèm qua WebSocket ngay lập tức
                const ok = sendMessage({
                    conversationId: convIdRef.current || null,
                    messageType: msgType,
                    content: isImage ? 'Đã gửi một hình ảnh' : `Đã gửi tệp: ${file.name}`,
                    fileUrl: fileUrl, // Gửi link này cho Backend nhận
                    fileName: finalData?.fileName || file.name // Tên file hiển thị
                });

                if (ok) {
                    checkAndReloadIfFirstMsg();
                } else {
                    toast.error('Lỗi gửi dữ liệu file qua WebSocket');
                }
            } else {
                toast.error('Không tìm thấy đường dẫn URL của file sau khi upload');
            }
        } catch (error) {
            console.error('[Chat] Upload error:', error);
            toast.error('Upload file không thành công, vui lòng thử lại');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input file
        }
    };

    const triggerFileInput = () => {
        if (!wsReady) {
            toast.error('Đang kết nối, vui lòng thử lại sau...');
            return;
        }
        fileInputRef.current?.click();
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

    const handleChatButtonClick = () => {
        if (!isAuthenticated) { dispatch(openLoginModal()); return; }
        dispatch(toggleChat());
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="font-sans">
            {/* Input chọn file ẩn để tùy biến giao diện nút Paperclip */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            />

            {/* ── CHAT WINDOW ─────────────────────────────────────────────────── */}
            {isChatOpen && (
                <div className="
                    fixed z-[9999] bg-white border border-slate-100 shadow-2xl flex flex-col overflow-hidden
                    bottom-4 right-4 left-4 top-4 rounded-2xl
                    sm:top-auto sm:left-auto sm:bottom-28 sm:right-6 sm:w-[380px] sm:h-[580px] sm:max-h-[80vh]
                ">
                    {/* Header */}
                    <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="relative">
                                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                                    <img src={chatAvatar} alt="avatar" className="w-full h-full object-cover" />
                                </div>
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-500 font-medium leading-none">Nhà Thuốc Quốc Thái</p>
                                <p className="text-sm font-bold text-slate-800 leading-tight">Tư Vấn Dược Sĩ</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {wsError && (
                                <button onClick={handleReconnect} title="Kết nối lại"
                                    className="p-1.5 rounded-full hover:bg-slate-100 text-red-400 transition-colors">
                                    <RefreshCw size={14} />
                                </button>
                            )}
                            <button onClick={() => dispatch(closeChat())}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                                <X size={17} />
                            </button>
                        </div>
                    </div>

                    {/* Thanh trạng thái WebSocket hoặc Trạng thái đang upload file */}
                    {!wsReady && isAuthenticated ? (
                        <div className="px-3 py-1 bg-amber-50 border-b border-amber-100 text-[10px] text-amber-600 flex items-center gap-1.5 flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            {wsError ? 'Mất kết nối — nhấn nút làm mới để thử lại' : 'Đang kết nối...'}
                        </div>
                    ) : uploading ? (
                        <div className="px-3 py-1 bg-blue-50 border-b border-blue-100 text-[10px] text-blue-600 flex items-center gap-1.5 flex-shrink-0">
                            <Loader2 size={11} className="animate-spin" />
                            Đang xử lý tải lên và gửi tệp tin...
                        </div>
                    ) : null}

                    {/* Messages area */}
                    <div className="flex-1 px-3 py-3 overflow-y-auto bg-slate-50 space-y-3">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                                <img src={chatAvatar} alt="" className="w-16 h-16 opacity-30 rounded-full" />
                                <div className="text-center">
                                    <p className="text-sm font-medium text-slate-500">Xin chào!</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Nhắn tin để được dược sĩ tư vấn trực tiếp</p>
                                </div>
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
                        className="flex items-center gap-1.5 px-2 py-2 bg-white border-t border-slate-100 flex-shrink-0"
                    >
                        <button
                            type="button"
                            onClick={triggerFileInput}
                            disabled={uploading || !wsReady}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors flex-shrink-0 disabled:opacity-50"
                        >
                            <Paperclip size={15} />
                        </button>
                        <input
                            type="text"
                            placeholder={wsReady ? 'Nhắn tin...' : 'Đang kết nối...'}
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={!wsReady || uploading}
                            className="flex-1 bg-slate-100 border-0 outline-none text-[13px] px-3 py-2 rounded-full focus:ring-1 focus:ring-blue-400 disabled:opacity-50 text-slate-700 placeholder-slate-400"
                        />
                        <button
                            type="submit"
                            disabled={!inputText.trim() || !wsReady || uploading}
                            className="p-2 rounded-full transition-colors disabled:text-slate-300 text-blue-600 hover:bg-blue-50 flex-shrink-0"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}

            {/* ── FLOATING BUTTON ─────────────────────────────────────────────── */}
            <div
                onClick={handleChatButtonClick}
                className="fixed z-[9999] cursor-pointer select-none transition-all duration-300 transform hover:scale-105 active:scale-95 drop-shadow-lg bottom-20 right-20 w-16 h-16 sm:bottom-8 sm:right-3 sm:w-20 sm:h-20"
            >
                <img src={chatIcon} alt="Tư vấn trực tuyến" className="w-16 h-16 object-contain" />

                {/* Chấm cam thông báo bounce nhảy nhẹ khi có tin nhắn mới tới */}
                {hasNewMessage && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-orange-500 rounded-full border-2 border-white animate-bounce shadow-md" />
                )}

                {/* Chấm vàng báo lỗi kết nối */}
                {!wsReady && isAuthenticated && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white animate-pulse" />
                )}
            </div>
        </div>
    );
}