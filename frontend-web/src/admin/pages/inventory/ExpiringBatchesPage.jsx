import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import inventoryAdminService from '../../service/inventoryAdminService';

const ExpiringBatchesPage = () => {
    const navigate = useNavigate();
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [days, setDays] = useState(90);
    const [page, setPage] = useState(0);
    const [size] = useState(15);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => { fetchExpiring(); }, [page, days]);

    const fetchExpiring = async () => {
        try {
            setLoading(true);
            const res = await inventoryAdminService.getExpiring({ days, page, size });
            const result = res.data?.result;
            setBatches(result?.content || []);
            setTotalPages(result?.totalPages || 0);
        } catch (error) {
            console.error(error);
            toast.error('Không tải được danh sách sắp hết hạn');
        } finally {
            setLoading(false);
        }
    };

    const handleDaysChange = (val) => { setDays(val); setPage(0); };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

    const getDaysLeft = (expiryDate) => {
        if (!expiryDate) return null;
        return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    };

    const getDaysBadge = (expiryDate) => {
        const d = getDaysLeft(expiryDate);
        if (d === null) return null;
        if (d <= 0) return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600 border border-red-100">Đã hết hạn</span>;
        if (d <= 30) return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600 border border-red-100">Còn {d} ngày</span>;
        return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-100">Còn {d} ngày</span>;
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-0 md:p-6 text-[#1C2434] font-satoshi">
            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>

            <div className=" flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h2 className="text-xl font-bold text-[#1C2434]">Thuốc sắp hết hạn</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">Các lô hàng sắp hết hạn sử dụng</p>
                </div>
                <p className="text-xs text-[#64748B]">Home &gt; Quản lý kho &gt; Sắp hết hạn</p>
            </div>

            <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0]">
                {/* Filter */}
                <div className="p-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-[#64748B]">Hết hạn trong:</span>
                    {[30, 60, 90, 180].map((d) => (
                        <button
                            key={d}
                            onClick={() => handleDaysChange(d)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${days === d ? 'bg-[#3C50E0] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'}`}
                        >
                            {d} ngày
                        </button>
                    ))}
                    <input
                        type="number"
                        min="1"
                        value={days}
                        onChange={(e) => handleDaysChange(Number(e.target.value) || 90)}
                        className="bg-white border border-[#E2E8F0] rounded-md px-2 py-1.5 text-xs text-[#1C2434] focus:outline-none focus:border-[#3C50E0] w-20"
                        placeholder="Số ngày"
                    />
                </div>

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
                                        <th className="p-2.5 pl-4 uppercase tracking-wider font-bold">Sản phẩm</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Variant / SKU</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Số lô</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Tồn kho</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">HSD</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Thời gian còn lại</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold text-right pr-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-[#E2E8F0]">
                                    {batches.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center p-8 text-green-600 font-medium">
                                                ✓ Không có lô nào hết hạn trong {days} ngày tới.
                                            </td>
                                        </tr>
                                    ) : batches.map((batch) => (
                                        <tr key={batch.id} className="hover:bg-[#F8FAFC] transition-colors">
                                            <td className="p-2.5 pl-4 font-medium text-[#1C2434] max-w-[180px] truncate">{batch.productName}</td>
                                            <td className="p-2.5">
                                                <div className="text-[#64748B]">{batch.variantName}</div>
                                                <div className="text-[10px] text-[#8A99AD]">{batch.sku}</div>
                                            </td>
                                            <td className="p-2.5 font-semibold text-[#3C50E0]">{batch.batchNumber}</td>
                                            <td className="p-2.5 font-bold text-[#1C2434]">{batch.remainingQuantity?.toLocaleString('vi-VN')}</td>
                                            <td className="p-2.5 text-[#64748B]">{formatDate(batch.expiryDate)}</td>
                                            <td className="p-2.5">{getDaysBadge(batch.expiryDate)}</td>
                                            <td className="p-2.5 text-right pr-4">
                                                <button onClick={() => navigate(`/admin/inventory/batches/${batch.id}`)} className="text-xs text-[#3C50E0] hover:underline">Chi tiết</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

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

export default ExpiringBatchesPage;
