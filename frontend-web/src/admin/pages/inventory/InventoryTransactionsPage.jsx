import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import inventoryAdminService from '../../service/inventoryAdminService';

const TYPE_LABELS = {
    IMPORT: { label: 'Nhập kho', cls: 'bg-green-50 text-green-600 border border-green-100' },
    EXPORT: { label: 'Xuất kho', cls: 'bg-blue-50 text-blue-600 border border-blue-100' },
    RETURN: { label: 'Hoàn kho', cls: 'bg-indigo-50 text-indigo-600 border border-indigo-100' },
    CANCEL: { label: 'Hủy', cls: 'bg-red-50 text-red-600 border border-red-100' },
    ADJUSTMENT: { label: 'Điều chỉnh', cls: 'bg-amber-50 text-amber-600 border border-amber-100' },
};

const InventoryTransactionsPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    const [typeFilter, setTypeFilter] = useState('');
    const [variantIdFilter, setVariantIdFilter] = useState('');
    // State trung gian phục vụ cơ chế Debounce tự động trigger API
    const [debouncedVariantId, setDebouncedVariantId] = useState('');

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const [page, setPage] = useState(0);
    const [size] = useState(15);
    const [totalPages, setTotalPages] = useState(0);

    // 1. useEffect lắng nghe ô nhập Variant ID, dừng gõ 1s (1000ms) mới cập nhật biến chính
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedVariantId(variantIdFilter);
            setPage(0); // Reset về trang đầu khi từ khóa thay đổi
        }, 1000);
        return () => clearTimeout(timer);
    }, [variantIdFilter]);

    // 2. useEffect gọi API lắng nghe theo biến debouncedVariantId thay vì biến gốc
    useEffect(() => {
        fetchTransactions();
    }, [page, typeFilter, debouncedVariantId, fromDate, toDate]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const params = { page, size };
            if (typeFilter) params.type = typeFilter;
            if (debouncedVariantId.trim()) params.variantId = debouncedVariantId.trim();
            if (fromDate) params.fromDate = `${fromDate}T00:00:00`;
            if (toDate) params.toDate = `${toDate}T23:59:59`;

            const res = await inventoryAdminService.getTransactions(params);
            const result = res.data?.result;
            setTransactions(result?.content || []);
            setTotalPages(result?.totalPages || 0);
        } catch (error) {
            console.error(error);
            toast.error('Không tải được lịch sử giao dịch kho');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (d) => d ? new Date(d).toLocaleString('vi-VN') : '—';

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-0 md:p-6 text-[#1C2434] font-satoshi">
            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>

            <div className=" flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h2 className="text-xl font-bold text-[#1C2434]">Lịch sử giao dịch kho</h2>
                <p className="text-xs text-[#64748B]">Home &gt; Quản lý kho &gt; Giao dịch</p>
            </div>

            <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0]">
                {/* Header */}
                <div className="p-3 border-b border-[#E2E8F0] text-start">
                    <h2 className="text-lg font-bold text-[#1C2434]">Lịch sử giao dịch kho</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">Toàn bộ nhập / xuất / hoàn / điều chỉnh kho</p>
                </div>

                {/* Filter */}
                <div className="p-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col lg:flex-row gap-3 items-start lg:items-center">
                    <select
                        className="bg-white border border-[#E2E8F0] rounded-md px-2 py-1.5 text-xs text-[#1C2434] focus:outline-none focus:border-[#3C50E0] transition-all"
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
                    >
                        <option value="">Tất cả loại</option>
                        <option value="IMPORT">Nhập kho</option>
                        <option value="EXPORT">Xuất kho</option>
                        <option value="RETURN">Hoàn kho</option>
                        <option value="CANCEL">Hủy</option>
                        <option value="ADJUSTMENT">Điều chỉnh</option>
                    </select>

                    {/* Ô nhập Variant ID có thêm hiệu ứng loading xoay nhỏ góc phải khi đang trong quá trình chờ gõ */}
                    <div className="relative">
                        <input
                            type="text"
                            className="bg-white border border-[#E2E8F0] rounded-md pl-2 pr-7 py-1.5 text-xs text-[#1C2434] placeholder-[#8A99AD] focus:outline-none focus:border-[#3C50E0] transition-all w-56"
                            placeholder="Lọc theo Variant ID..."
                            value={variantIdFilter}
                            onChange={(e) => { setVariantIdFilter(e.target.value); }}
                        />
                        {variantIdFilter !== debouncedVariantId && (
                            <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                                <div className="animate-spin w-3 h-3 border-2 border-[#3C50E0] border-t-transparent rounded-full" />
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(0); }} className="bg-white border border-[#E2E8F0] rounded-md px-2 py-1.5 text-xs text-[#1C2434] focus:outline-none focus:border-[#3C50E0]" />
                        <span className="text-[#8A99AD] text-xs">→</span>
                        <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(0); }} className="bg-white border border-[#E2E8F0] rounded-md px-2 py-1.5 text-xs text-[#1C2434] focus:outline-none focus:border-[#3C50E0]" />
                    </div>

                    {/* Nút tìm kiếm cũ đã được loại bỏ */}

                    {(typeFilter || variantIdFilter || fromDate || toDate) && (
                        <button
                            onClick={() => { setTypeFilter(''); setVariantIdFilter(''); setDebouncedVariantId(''); setFromDate(''); setToDate(''); setPage(0); }}
                            className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1.5 rounded-md hover:bg-red-50 transition-all"
                        >
                            Xóa Lọc
                        </button>
                    )}
                </div>

                {/* Table */}
                {loading ? (
                    <div className="p-10 text-center text-[#64748B] text-xs">
                        <div className="animate-spin inline-block w-5 h-5 border-[2.5px] border-current border-t-transparent text-[#3C50E0] rounded-full mr-2" />
                        Đang tải giao dịch...
                    </div>
                ) : (
                    <>
                        <div className="max-w-full overflow-x-auto no-scrollbar">
                            <table className="w-full table-auto text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#E2E8F0] bg-[#F7F9FC] text-xs font-semibold text-[#64748B]">
                                        <th className="p-2.5 pl-4 uppercase tracking-wider font-bold">Thời gian</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Loại</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Sản phẩm</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Variant</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Số lô</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Số lượng</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Reference</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-[#E2E8F0]">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center p-8 text-[#64748B]">Không có giao dịch nào.</td>
                                        </tr>
                                    ) : transactions.map((tx) => {
                                        const typeInfo = TYPE_LABELS[tx.type] || { label: tx.type, cls: 'bg-gray-50 text-gray-600' };
                                        return (
                                            <tr key={tx.id} className="hover:bg-[#F8FAFC] transition-colors">
                                                <td className="p-2.5 pl-4 text-[#64748B] whitespace-nowrap">{formatDateTime(tx.createdAt)}</td>
                                                <td className="p-2.5">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${typeInfo.cls}`}>{typeInfo.label}</span>
                                                </td>
                                                <td className="p-2.5 font-medium text-[#1C2434] max-w-[160px] truncate">{tx.productName}</td>
                                                <td className="p-2.5 text-[#64748B]">
                                                    <div>{tx.variantName}</div>
                                                    <div className="text-[10px] text-[#8A99AD]">{tx.sku}</div>
                                                </td>
                                                <td className="p-2.5 font-semibold text-[#3C50E0]">{tx.batchNumber}</td>
                                                <td className="p-2.5">
                                                    <span className={`font-bold ${tx.type === 'IMPORT' || tx.type === 'RETURN' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {tx.type === 'IMPORT' || tx.type === 'RETURN' ? '+' : '-'}{tx.quantity?.toLocaleString('vi-VN')}
                                                    </span>
                                                </td>
                                                <td className="p-2.5 text-[#64748B] max-w-[120px] truncate">{tx.referenceId || '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-between items-center px-4 py-3 border-t border-[#E2E8F0] bg-white relative z-10">
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
};

export default InventoryTransactionsPage;