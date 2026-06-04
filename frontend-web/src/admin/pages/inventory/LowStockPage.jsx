import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import inventoryAdminService from '../../service/inventoryAdminService';

const LowStockPage = () => {
    const navigate = useNavigate();
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [size] = useState(15);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => { fetchLowStock(); }, [page]);

    const fetchLowStock = async () => {
        try {
            setLoading(true);
            const res = await inventoryAdminService.getLowStock({ page, size });
            const result = res.data?.result;
            setBatches(result?.content || []);
            setTotalPages(result?.totalPages || 0);
        } catch (error) {
            console.error(error);
            toast.error('Không tải được danh sách tồn thấp');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

    const getStockPercent = (remaining, threshold) => {
        if (!threshold || threshold === 0) return 100;
        return Math.min(100, Math.round((remaining / threshold) * 100));
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-6 text-[#1C2434] font-satoshi">
            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>

            <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className='text-start'>
                    <h2 className="text-xl font-bold text-[#1C2434]">Cảnh báo tồn thấp</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">Các lô hàng có tồn kho ≤ ngưỡng cảnh báo</p>
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-xs text-[#64748B]">Home &gt; Quản lý kho &gt; Tồn thấp</p>

                </div>
            </div>

            <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0]">
                <div className="d-flex p-3 border-b border-[#E2E8F0] flex items-center gap-2">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
                        {batches.length} lô cần nhập thêm (trang này)
                    </span>
                    <button
                        onClick={() => navigate('/admin/inventory/import')}
                        className="flex items-center gap-1.5 bg-[#3C50E0] text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-opacity-90 transition-all"
                    >
                        Nhập kho
                    </button>
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
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Variant</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Số lô</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Tồn kho</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Ngưỡng</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Mức độ</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">HSD</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold text-right pr-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-[#E2E8F0]">
                                    {batches.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center p-8 text-green-600 font-medium">
                                                ✓ Tất cả lô hàng đều đủ tồn kho!
                                            </td>
                                        </tr>
                                    ) : batches.map((batch) => {
                                        const pct = getStockPercent(batch.remainingQuantity, batch.lowStockThreshold);
                                        const barColor = pct <= 25 ? 'bg-red-500' : pct <= 60 ? 'bg-amber-400' : 'bg-green-400';
                                        return (
                                            <tr key={batch.id} className="hover:bg-[#F8FAFC] transition-colors">
                                                <td className="p-2.5 pl-4 font-medium text-[#1C2434] max-w-[180px] truncate">{batch.productName}</td>
                                                <td className="p-2.5 text-[#64748B]">
                                                    <div>{batch.variantName}</div>
                                                    <div className="text-[10px] text-[#8A99AD]">{batch.sku}</div>
                                                </td>
                                                <td className="p-2.5 font-semibold text-[#3C50E0]">{batch.batchNumber}</td>
                                                <td className="p-2.5 font-bold text-amber-600">{batch.remainingQuantity?.toLocaleString('vi-VN')}</td>
                                                <td className="p-2.5 text-[#64748B]">{batch.lowStockThreshold?.toLocaleString('vi-VN')}</td>
                                                <td className="p-2.5 w-32">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                                                        </div>
                                                        <span className="text-[10px] text-[#64748B] w-8">{pct}%</span>
                                                    </div>
                                                </td>
                                                <td className="p-2.5 text-[#64748B]">{formatDate(batch.expiryDate)}</td>
                                                <td className="p-2.5 text-right pr-4">
                                                    <button
                                                        onClick={() => navigate(`/admin/inventory/batches/${batch.id}`)}
                                                        className="text-xs text-[#3C50E0] hover:underline"
                                                    >
                                                        Chi tiết
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
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

export default LowStockPage;
