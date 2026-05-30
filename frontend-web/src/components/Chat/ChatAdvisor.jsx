import { useState, useEffect, useRef } from 'react'; // <-- Đã thêm useEffect và useRef
import { X, Send, Paperclip } from 'lucide-react';
import chatIcon from '../../assets/chat.png';
import chatAvatar from '../../assets/avatar-chat.png';
import { useDispatch, useSelector } from 'react-redux';
import { openLoginModal } from '../../redux/slices/authSlice';
import { toggleChat, closeChat } from '../../redux/slices/chatSlice';

export default function ChatAdvisor() {
    // Bên trong component ChatAdvisor:
    const { isAuthenticated } = useSelector((state) => state.auth);
    console.log('ChatAdvisor - isAuthenticated:', isAuthenticated);
    const dispatch = useDispatch();

    const isChatOpen = useSelector((state) => state.chat.isChatOpen);
    const [message, setMessage] = useState('');
    const handleChatButtonClick = () => {
        if (!isAuthenticated) {
            dispatch(openLoginModal()); // Gọi Redux mở modal đăng nhập lên
            return;
        }
        dispatch(toggleChat());
    };
    const handleCloseChat = () => {
        dispatch(closeChat())
    }

    const [messages, setMessages] = useState([
        { id: 1, sender: 'bot', text: 'Dạ mình đã lên đơn hàng chưa ạ' },
        { id: 2, sender: 'user', text: 'mình mới gọi điện hủy đơn rồi ạ' },
        { id: 3, sender: 'bot', text: 'Dạ vâng ạ' },
        {
            id: 4,
            sender: 'bot',
            text: 'Cảm ơn Quý khách đã liên hệ. Bất cứ khi nào cần hỗ trợ thêm, hãy nhắn tin ngay cho Quốc Thái. Kính chúc Quý khách một ngày tốt lành! 💙'
        }
    ]);

    // ─── TỰ ĐỘNG SCROLL XUỐNG TIN NHẮN MỚI NHẤT ───
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Cuộn xuống khi danh sách tin nhắn thay đổi HOẶC khi mở hộp chat lên
    useEffect(() => {
        if (isChatOpen) {
            scrollToBottom();
        }
    }, [messages, isChatOpen]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        setMessages([...messages, { id: Date.now(), sender: 'user', text: message.trim() }]);
        setMessage('');
    };

    return (
        <div className="font-sans">

            {/* ─── KHỐI MODAL CHAT ─── */}
            {isChatOpen && (
                <div className="
                    fixed z-[9999] bg-white border border-slate-100 shadow-2xl flex flex-col overflow-hidden
                    transition-all duration-200 animate-in fade-in slide-in-from-bottom-5
                    
                    /* Cấu hình Mobile */
                    bottom-4 right-4 left-4 top-4 rounded-2xl
                    
                    /* Cấu hình PC chống vỡ tràn viền */
                    sm:top-auto sm:left-auto 
                    sm:bottom-28 sm:right-6 
                    sm:w-[360px] 
                    sm:h-[500px]          
                    sm:max-h-[70vh]       
                ">

                    {/* Header (Để p-4 cho chữ không bị dính sát viền trên) */}
                    <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-blue-600 font-bold tracking-wider uppercase leading-none">Nhà Thuốc</span>
                                <span className="text-sm font-black text-blue-800 tracking-wide">QUỐC THÁI</span>
                            </div>
                        </div>
                        <button
                            onClick={() => handleCloseChat()}
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Vùng hiển thị nội dung Chat */}
                    <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                            >
                                {msg.sender === 'bot' && (
                                    <div className="w-8 h-8 rounded-full bg-blue-600 border border-blue-400 flex-shrink-0 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                                        <img src={chatAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <div
                                    className={`p-3 rounded-2xl text-[14px] shadow-sm leading-relaxed ${msg.sender === 'user'
                                        ? 'bg-blue-50 text-slate-800 rounded-tr-none border border-blue-100'
                                        : 'bg-white text-slate-800 rounded-tl-none'
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {/* Điểm neo để trình duyệt nhận diện đáy hộp chat */}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Form nhập dữ liệu tin nhắn dưới đáy (Để p-3 giúp cân đối các nút bấm) */}
                    <form
                        onSubmit={handleSendMessage}
                        className="p-1 bg-white border-t border-slate-100 flex items-center gap-2 flex-shrink-0"
                    >
                        <button
                            type="button"
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
                        >
                            <Paperclip size={18} />
                        </button>

                        <input
                            type="text"
                            placeholder="Gửi yêu cầu..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="flex-1 bg-slate-100 border-0 outline-none text-[14px] px-4 py-2 rounded-full focus:ring-1 focus:ring-blue-500 text-slate-700"
                        />

                        <button
                            type="submit"
                            disabled={!message.trim()}
                            className={`p-2 rounded-full transition-colors ${message.trim() ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-300'}`}
                        >
                            <Send size={18} />
                        </button>
                    </form>

                </div>
            )}

            {/* ─── NÚT BẤM ẢNH CỐ ĐỊNH Ở GÓC DƯỚI ─── */}
            <div
                onClick={handleChatButtonClick}
                className=" d-flex items-center justify-center
                    fixed z-[9999] cursor-pointer select-none transition-all duration-300 transform hover:scale-105 active:scale-95 drop-shadow-lg
                    bottom-20 right-20 w-16 h-16
                    sm:bottom-8 sm:right-3   sm:w-20 sm:h-20
                "
            >
                <img
                    src={chatIcon}
                    alt="Tư vấn trực tuyến"
                    className="w-16 h-16 object-contain"
                />
            </div>

        </div>
    );
}