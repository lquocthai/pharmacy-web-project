import React, { useState } from 'react';

const quickPrompts = [
    'Kiểm tra tồn kho thuốc cảm cúm',
    'Gợi ý trả lời khách hỏi đơn kê toa',
    'Tóm tắt đơn hàng cần xử lý hôm nay',
    'Nhắc lịch nhập hàng sắp hết'
];

const conversations = [
    {
        id: 1,
        title: 'Sản phẩm nào có doanh thu cao nhất tuần qua',
        lastMessage: 'oke.',
        time: '09:24',
        active: true
    },
    {
        id: 2,
        title: 'Sản phẩm nào còn dưới 10 sản phẩm',
        lastMessage: 'Hiện không có sản phẩm nào có dưới 10 sản phẩm.',
        time: 'Hôm qua',
        active: false
    },

];

const initialMessages = [
    // {
    //     id: 1,
    //     sender: 'bot',
    //     name: 'Pharmacy Bot',
    //     time: '09:20',
    //     text: 'Chào admin, tôi có thể hỗ trợ tra cứu tồn kho, gợi ý phản hồi khách hàng, tóm tắt đơn hàng và nhắc các việc cần xử lý trong hệ thống.'
    // },
    // {
    //     id: 2,
    //     sender: 'admin',
    //     name: 'Admin',
    //     time: '09:21',
    //     text: 'Hôm nay có việc nào cần ưu tiên không?'
    // },
    // {
    //     id: 3,
    //     sender: 'bot',
    //     name: 'Pharmacy Bot',
    //     time: '09:22',
    //     text: 'Có 3 đơn COD đang chờ xác nhận, 2 sản phẩm sắp hết hàng và 1 yêu cầu tư vấn thuốc kê đơn cần được kiểm tra kỹ trước khi phản hồi.'
    // }
];

const ChatBotPage = () => {
    const [messages, setMessages] = useState(initialMessages);
    const [messageInput, setMessageInput] = useState('');

    const handleSendMessage = () => {
        const trimmedMessage = messageInput.trim();

        if (!trimmedMessage) {
            return;
        }

        setMessages((prevMessages) => [
            ...prevMessages,
            {
                id: Date.now(),
                sender: 'admin',
                name: 'Admin',
                time: 'Vừa xong',
                text: trimmedMessage
            }
        ]);
        setMessageInput('');
    };

    const handleQuickPrompt = (prompt) => {
        setMessageInput(prompt);
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-6 text-[#1C2434] font-satoshi">
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-[#1C2434]">ChatBot Admin</h2>
                </div>
                <p className="text-xs text-[#64748B]">Home &gt; ChatBot Admin</p>
            </div>

            <div
                style={{ borderRadius: '1rem' }}
                className="grid min-h-[calc(100vh-130px)] overflow-hidden border border-[#E2E8F0] bg-white shadow-sm lg:grid-cols-[300px_1fr]"
            >
                <aside className="border-b border-[#E2E8F0] bg-white lg:border-b-0 lg:border-r">
                    <div className="border-b border-[#E2E8F0] p-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold text-[#1C2434]">Hội thoại</h3>
                                <p className="mt-0.5 text-xs text-[#64748B]">Quản lý các phiên chat hỗ trợ admin.</p>
                            </div>
                            <button className="flex h-8 w-8 items-center justify-center rounded-md bg-[#3C50E0] text-white shadow-sm transition-all hover:bg-opacity-90">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            </button>
                        </div>

                        <div className="relative mt-3">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                                <svg className="h-4 w-4 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                className="w-full rounded-md border border-[#E2E8F0] bg-white py-1.5 pl-8 pr-3 text-xs text-[#1C2434] placeholder-[#8A99AD] transition-all focus:border-[#3C50E0] focus:outline-none"
                                placeholder="Tìm hội thoại..."
                            />
                        </div>
                    </div>

                    <div className="max-h-[260px] overflow-y-auto p-2 lg:max-h-none">
                        {conversations.map((conversation) => (
                            <button
                                key={conversation.id}
                                className={`mb-1 w-full rounded-md border p-2.5 text-left transition-all ${conversation.active
                                    ? 'border-[#C7D2FE] bg-[#EBF0FF]'
                                    : 'border-transparent bg-white hover:border-[#E2E8F0] hover:bg-[#F8FAFC]'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-xs font-bold text-[#1C2434]">{conversation.title}</p>
                                    <span className="whitespace-nowrap text-[10px] font-medium text-[#64748B]">{conversation.time}</span>
                                </div>
                                <p className="mt-1 line-clamp-1 text-[11px] text-[#64748B]">{conversation.lastMessage}</p>
                            </button>
                        ))}
                    </div>
                </aside>

                <section className="flex min-h-[560px] flex-col bg-[#F8FAFC]">
                    <div className="flex flex-col gap-3 border-b border-[#E2E8F0] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#C7D2FE] bg-[#EBF0FF] text-[#3C50E0]">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M7 16h10a4 4 0 004-4V8a4 4 0 00-4-4H7a4 4 0 00-4 4v4a4 4 0 004 4z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#1C2434]">Pharmacy Assistant</h3>
                                <div className="mt-0.5 flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-[#10B981]"></span>
                                    <p className="text-xs text-[#64748B]">Đang sẵn sàng hỗ trợ admin</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#1C2434] transition-all hover:bg-[#F8FAFC]">
                                <svg className="h-3.5 w-3.5 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                                </svg>
                                Lịch sử
                            </button>
                            <button className="flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#1C2434] transition-all hover:bg-[#F8FAFC]">
                                <svg className="h-3.5 w-3.5 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m9 6h3.75m-3.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-9.75 0h9.75m-3 6h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-3.75 0H7.5" />
                                </svg>
                                Cài đặt
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto p-3 md:p-4">
                        <div className="rounded-md border border-[#E2E8F0] bg-white p-3">
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Gợi ý nhanh</p>
                                <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-medium text-[#10B981]">Online</span>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                {quickPrompts.map((prompt) => (
                                    <button
                                        key={prompt}
                                        onClick={() => handleQuickPrompt(prompt)}
                                        className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-left text-xs font-medium text-[#1C2434] transition-all hover:border-[#3C50E0] hover:bg-[#EBF0FF] hover:text-[#3C50E0]"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {messages.map((message) => {
                                const isAdmin = message.sender === 'admin';

                                return (
                                    <div key={message.id} className={`flex gap-2.5 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                        {!isAdmin && (
                                            <div className="mt-5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-[#C7D2FE] bg-[#EBF0FF] text-[#3C50E0]">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104a2.25 2.25 0 014.5 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M9.75 3.104h4.5M5 14.5h14M7 14.5v3.75A2.75 2.75 0 009.75 21h4.5A2.75 2.75 0 0017 18.25V14.5" />
                                                </svg>
                                            </div>
                                        )}

                                        <div className={`max-w-[780px] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col`}>
                                            <div className="mb-1 flex items-center gap-2 text-[10px] text-[#64748B]">
                                                <span className="font-bold text-[#1C2434]">{message.name}</span>
                                                <span>{message.time}</span>
                                            </div>
                                            <div
                                                className={`rounded-md border px-3 py-2 text-sm leading-6 shadow-sm ${isAdmin
                                                    ? 'border-[#3C50E0] bg-[#3C50E0] text-white'
                                                    : 'border-[#E2E8F0] bg-white text-[#1C2434]'
                                                    }`}
                                            >
                                                {message.text}
                                            </div>
                                        </div>

                                        {isAdmin && (
                                            <div className="mt-5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-[#1C2434] text-xs font-bold text-white">
                                                A
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="border-t border-[#E2E8F0] bg-white p-3">
                        <div style={{ alignItems: 'center' }} className="flex flex-col gap-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2 focus-within:border-[#3C50E0] sm:flex-row sm:items-end">
                            <textarea
                                value={messageInput}
                                onChange={(event) => setMessageInput(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && !event.shiftKey) {
                                        event.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                rows="2"
                                className="min-h-[44px] flex-1 resize-none bg-transparent px-2 py-1 text-sm text-[#1C2434] placeholder-[#8A99AD] outline-none"
                                placeholder="Nhập tin nhắn cho chatbot..."
                            />
                            <div className="flex items-center justify-between gap-2 sm:justify-end">
                                <button className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#64748B] transition-all hover:bg-[#F8FAFC] hover:text-[#1C2434]">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94a3 3 0 114.243 4.243L8.552 18.32a1.5 1.5 0 11-2.121-2.121l9.192-9.193" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleSendMessage}
                                    className="flex items-center justify-center gap-1.5 rounded-md bg-[#3C50E0] px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={!messageInput.trim()}
                                >
                                    Gửi
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L6 12zm0 0h7.5" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <p className="mt-2 text-[11px] text-[#64748B]">Nhấn Enter để gửi, Shift + Enter để xuống dòng.</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ChatBotPage;
