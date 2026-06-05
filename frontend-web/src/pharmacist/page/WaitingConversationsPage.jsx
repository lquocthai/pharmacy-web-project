import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import chatService from '../../services/chat/chatService';
import {
    connectSocket,
    subscribeWaitingList,
    isConnected,
} from '../../services/chat/chatSocket';

const STATUS_BADGE = {
    PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
    IN_PROGRESS: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    RESOLVED: 'bg-blue-50 text-blue-600 border-blue-200',
    CLOSED: 'bg-gray-100 text-gray-500 border-gray-200',
};
const STATUS_LABEL = {
    PENDING: 'Chờ nhận', IN_PROGRESS: 'Đang tư vấn', RESOLVED: 'Đã giải quyết', CLOSED: 'Đã đóng',
};

export default function WaitingConversationsPage() {
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);

    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [claimingId, setClaimingId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [wsReady, setWsReady] = useState(false);

    const subRef = useRef(null);

    // ── Load data ─────────────────────────────────────────────────────────────
    const fetchConversations = useCallback(async () => {
        try {
            setLoading(true);
            let res;
            if (statusFilter === 'PENDING') {
                res = await chatService.getWaitingConversations(page, 15);
            } else {
                res = await chatService.getConversations({ status: statusFilter, page, size: 15 });
            }
            const result = res.data?.result;
            setConversations(result?.content || []);
            setTotalPages(result?.totalPages || 0);
        } catch (e) {
            console.error(e);
            toast.error('Không tải được danh sách hội thoại');
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => { fetchConversations(); }, [fetchConversations]);

    // ── WebSocket: realtime waiting list ─────────────────────────────────────
    useEffect(() => {
        const setupWs = () => {
            if (!isConnected()) {
                connectSocket({
                    onConnect: () => {
                        setWsReady(true);
                        subRef.current = subscribeWaitingList((updatedConv) => {
                            setConversations(prev => {
                                const idx = prev.findIndex(c => c.id === updatedConv.id);
                                if (idx >= 0) {
                                    const copy = [...prev];
                                    copy[idx] = updatedConv;
                                    // Nếu conversation không còn match filter thì bỏ đi
                                    if (statusFilter !== 'ALL' && updatedConv.status !== statusFilter) {
                                        return copy.filter(c => c.id !== updatedConv.id);
                                    }
                                    return copy;
                                }
                                // Conversation mới PENDING xuất hiện
                                if (statusFilter === 'PENDING' && updatedConv.status === 'PENDING') {
                                    return [updatedConv, ...prev];
                                }
                                return prev;
                            });
                        });
                    },
                    onDisconnect: () => setWsReady(false),
                });
            } else {
                setWsReady(true);
                subRef.current = subscribeWaitingList((updatedConv) => {
                    setConversations(prev => {
                        const idx = prev.findIndex(c => c.id === updatedConv.id);
                        if (idx >= 0) {
                            const copy = [...prev];
                            copy[idx] = updatedConv;
                            if (statusFilter !== 'ALL' && updatedConv.status !== statusFilter) {
                                return copy.filter(c => c.id !== updatedConv.id);
                            }
                            return copy;
                        }
                        if (statusFilter === 'PENDING' && updatedConv.status === 'PENDING') {
                            return [updatedConv, ...prev];
                        }
                        return prev;
                    });
                });
            }
        };
        setupWs();
        return () => { subRef.current?.unsubscribe?.(); };
    }, [statusFilter]);

    // ── Claim ─────────────────────────────────────────────────────────────────
    const handleClaim = async (conv) => {
        try {
            setClaimingId(conv.id);
            await chatService.claimConversation(conv.id);
            toast.success(`Đã nhận tư vấn từ ${conv.userDisplayName || 'khách hàng'}`);
            navigate(`/pharmacist/conversations/${conv.id}`);
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Không thể nhận tư vấn này');
            fetchConversations();
        } finally {
            setClaimingId(null);
        }
    };

    const formatTime = (t) => t ? new Date(t).toLocaleString('vi-VN') : '—';

    return (
        <div className="min-h-screen bg-[#F1F5F9] text-[#1C2434] font-satoshi">
            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>

            {/* Breadcrumb */}
            <div className="mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="text-start">
                    <h2 className="text-xl font-bold text-[#1C2434]">Hàng đợi tư vấn</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">Nhận và quản lý các cuộc tư vấn dược</p>
                </div>
                <div className="flex items-center gap-2">
                    {wsReady ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-medium border border-emerald-200">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Realtime
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-medium border border-amber-200">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                            Đang kết nối
                        </span>
                    )}
                    <p className="text-xs text-[#64748B]">Home &gt; Hàng đợi</p>
                </div>
            </div>

            <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0]">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 border-b border-[#E2E8F0]">
                    <div>
                        <h2 className="text-base font-bold text-[#1C2434]">Danh sách hội thoại</h2>
                    </div>
                    <button
                        onClick={fetchConversations}
                        className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] text-[#1C2434] px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[#F8FAFC] transition-all"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Làm mới
                    </button>
                </div>

                {/* Filter bar */}
                <div className="p-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap gap-2 items-center">
                    {['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setPage(0); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${statusFilter === s ? 'bg-[#3C50E0] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'}`}
                        >
                            {STATUS_LABEL[s]}
                        </button>
                    ))}
                </div>

                {/* Table */}
                {loading ? (
                    <div className="p-10 text-center text-[#64748B] text-xs">
                        <div className="animate-spin inline-block w-5 h-5 border-[2.5px] border-current border-t-transparent text-[#3C50E0] rounded-full mr-2" />
                        Đang tải...
                    </div>
                ) : (
                    <>
                        <div className="max-w-full overflow-x-auto no-scrollbar">
                            <table className="w-full table-auto text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#E2E8F0] bg-[#F7F9FC] text-xs font-semibold text-[#64748B]">
                                        <th className="p-2.5 pl-4 uppercase tracking-wider font-bold">Khách hàng</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Trạng thái</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Tin cuối</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Số tin</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Thời gian</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold text-right pr-4">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-[#E2E8F0]">
                                    {conversations.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center p-8 text-[#64748B]">
                                                Không có hội thoại nào.
                                            </td>
                                        </tr>
                                    ) : conversations.map((conv) => (
                                        <tr key={conv.id} className="hover:bg-[#F8FAFC] transition-colors">
                                            <td className="p-2.5 pl-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-[#EBF0FF] flex items-center justify-center text-[#3C50E0] font-bold text-[11px] flex-shrink-0">
                                                        {conv.userDisplayName?.charAt(0)?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-[#1C2434]">{conv.userDisplayName || 'Khách hàng'}</p>
                                                        <p className="text-[10px] text-[#8A99AD] truncate max-w-[120px]">{conv.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-2.5">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_BADGE[conv.status]}`}>
                                                    {STATUS_LABEL[conv.status] || conv.status}
                                                </span>
                                            </td>
                                            <td className="p-2.5 text-[#64748B] max-w-[150px]">
                                                <p className="truncate">{conv.lastMessageContent || '—'}</p>
                                                {conv.lastMessageSenderRole && (
                                                    <p className="text-[10px] text-[#8A99AD]">{conv.lastMessageSenderRole}</p>
                                                )}
                                            </td>
                                            <td className="p-2.5 text-[#64748B]">
                                                {conv.messageCount ?? '—'}
                                            </td>
                                            <td className="p-2.5 text-[#64748B] whitespace-nowrap">
                                                {formatTime(conv.lastMessageAt)}
                                            </td>
                                            <td className="p-2.5 text-right pr-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => navigate(`/pharmacist/conversations/${conv.id}`)}
                                                        className="px-2.5 py-1 text-[11px] font-medium border border-[#E2E8F0] rounded text-[#1C2434] bg-white hover:bg-[#F8FAFC] transition-all"
                                                    >
                                                        Xem
                                                    </button>
                                                    {conv.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => handleClaim(conv)}
                                                            disabled={!!claimingId}
                                                            className="px-2.5 py-1 text-[11px] font-medium bg-[#3C50E0] text-white rounded hover:bg-opacity-90 transition-all disabled:opacity-60"
                                                        >
                                                            {claimingId === conv.id ? '...' : 'Nhận tư vấn'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-between items-center px-4 py-3 border-t border-[#E2E8F0] bg-white">
                            <span className="text-xs text-[#64748B]">Trang {page + 1}/{totalPages || 1}</span>
                            <div className="flex items-center gap-1.5">
                                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-2.5 py-1 text-[11px] font-medium border border-[#E2E8F0] rounded text-[#1C2434] bg-white hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed transition-all">Trước</button>
                                <button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)} className="px-2.5 py-1 text-[11px] font-medium border border-[#E2E8F0] rounded text-[#1C2434] bg-white hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed transition-all">Sau</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
