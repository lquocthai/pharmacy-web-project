import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import chatService from '../../services/chat/chatService';

const STATUS_BADGE = {
    PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
    IN_PROGRESS: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    RESOLVED: 'bg-blue-50 text-blue-600 border-blue-200',
    CLOSED: 'bg-gray-100 text-gray-500 border-gray-200',
};
const STATUS_LABEL = {
    PENDING: 'Chờ nhận', IN_PROGRESS: 'Đang tư vấn', RESOLVED: 'Đã giải quyết', CLOSED: 'Đã đóng',
};

export default function ConversationManagementPage() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchId, setSearchId] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [size] = useState(15);

    // ── Debounce search ───────────────────────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(searchId); setPage(0); }, 800);
        return () => clearTimeout(t);
    }, [searchId]);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchConversations = useCallback(async () => {
        try {
            setLoading(true);
            const res = await chatService.getAllConversations(page, size);
            const result = res.data?.result;
            let list = result?.content || [];

            // Client-side filter by status (nếu backend không hỗ trợ filter trên /admin/all)
            if (statusFilter) {
                list = list.filter(c => c.status === statusFilter);
            }

            // Client-side filter by conversationId
            if (debouncedSearch.trim()) {
                const q = debouncedSearch.trim().toLowerCase();
                list = list.filter(c =>
                    c.id?.toLowerCase().includes(q) ||
                    c.userDisplayName?.toLowerCase().includes(q) ||
                    c.userId?.toLowerCase().includes(q)
                );
            }

            setConversations(list);
            setTotalPages(result?.totalPages || 0);
        } catch (e) {
            console.error(e);
            toast.error('Không tải được danh sách hội thoại');
        } finally {
            setLoading(false);
        }
    }, [page, size, statusFilter, debouncedSearch]);

    useEffect(() => { fetchConversations(); }, [fetchConversations]);

    const formatDateTime = (d) => d ? new Date(d).toLocaleString('vi-VN') : '—';

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-6 text-[#1C2434] font-satoshi">
            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>

            {/* Breadcrumb */}
            <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="text-start">
                    <h2 className=" text-xl font-bold text-[#1C2434]">Quản lý tư vấn</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">Xem toàn bộ lịch sử hội thoại tư vấn dược sĩ</p>
                </div>
                <p className="text-xs text-[#64748B]">Home &gt; Quản lý tư vấn</p>
            </div>

            <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0]">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 border-b border-[#E2E8F0]">
                    <div className="text-start">
                        <h3 className="text-base text-[#1C2434]">Tất cả hội thoại</h3>
                        <p className="text-xs text-[#64748B] mt-0.5">Admin chỉ xem — không chat, không claim</p>
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
                <div className="p-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col lg:flex-row gap-3 items-start lg:items-center">
                    {/* Search */}
                    <div className="relative w-full lg:w-72">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                            <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            className="w-full bg-white border border-[#E2E8F0] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#1C2434] placeholder-[#8A99AD] focus:outline-none focus:border-[#3C50E0] transition-all"
                            placeholder="Tìm theo ID hoặc tên khách hàng..."
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                        />
                        {searchId !== debouncedSearch && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                                <div className="animate-spin w-3 h-3 border-2 border-[#3C50E0] border-t-transparent rounded-full" />
                            </span>
                        )}
                    </div>

                    {/* Status filter */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <button
                            onClick={() => { setStatusFilter(''); setPage(0); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${statusFilter === '' ? 'bg-[#3C50E0] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'}`}
                        >
                            Tất cả
                        </button>
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
                                        <th className="p-2.5 pl-4 uppercase tracking-wider font-bold">ID Hội thoại</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Khách hàng</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Dược sĩ</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Trạng thái</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Tin cuối</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Cập nhật</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold text-right pr-4">ID đầy đủ</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-[#E2E8F0]">
                                    {conversations.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center p-8 text-[#64748B]">
                                                Không có hội thoại nào.
                                            </td>
                                        </tr>
                                    ) : conversations.map((conv) => (
                                        <tr key={conv.id} className="hover:bg-[#F8FAFC] transition-colors">
                                            <td className="p-2.5 pl-4">
                                                <span className="text-[10px] font-mono text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
                                                    {conv.id?.substring(0, 8)}...
                                                </span>
                                            </td>
                                            <td className="p-2.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-[#EBF0FF] flex items-center justify-center text-[#3C50E0] font-bold text-[10px] flex-shrink-0">
                                                        {conv.userDisplayName?.charAt(0)?.toUpperCase() || 'U'}
                                                    </div>
                                                    <span className="font-medium text-[#1C2434]">
                                                        {conv.userDisplayName || 'Khách hàng'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-2.5 text-[#64748B]">
                                                {conv.pharmacistId ? (
                                                    <span className="inline-flex px-1.5 py-0.5 rounded bg-[#EBF0FF] text-[#3C50E0] text-[10px] font-medium">
                                                        Đã phân công
                                                    </span>
                                                ) : (
                                                    <span className="text-[#8A99AD]">—</span>
                                                )}
                                            </td>
                                            <td className="p-2.5">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_BADGE[conv.status]}`}>
                                                    {STATUS_LABEL[conv.status] || conv.status}
                                                </span>
                                            </td>
                                            <td className="p-2.5 text-[#64748B] max-w-[160px]">
                                                <p className="truncate">{conv.lastMessageContent || '—'}</p>
                                            </td>
                                            <td className="p-2.5 text-[#64748B] whitespace-nowrap">
                                                {formatDateTime(conv.lastMessageAt)}
                                            </td>
                                            <td className="p-2.5 text-right pr-4">
                                                <span
                                                    className="inline-flex max-w-[180px] truncate rounded bg-[#EBF0FF] px-2.5 py-1 font-mono text-[10px] font-medium text-[#3C50E0]"
                                                    title={conv.id}
                                                >
                                                    {conv.id}
                                                </span>
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
