import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import inventoryAdminService from '../../service/inventoryAdminService';

const InventoryBatchListPage = () => {
    const navigate = useNavigate();

    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedKeyword, setDebouncedKeyword] = useState('');
    const [batchNumberFilter, setBatchNumberFilter] = useState('');
    const [expiryFrom, setExpiryFrom] = useState('');
    const [expiryTo, setExpiryTo] = useState('');

    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    const [activeDropdown, setActiveDropdown] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(searchTerm);
            setPage(0);
        }, 1000);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchBatches();
    }, [page, debouncedKeyword, batchNumberFilter, expiryFrom, expiryTo]);

    const fetchBatches = async () => {
        try {
            setLoading(true);
            const params = {
                page,
                size,
                sortBy: 'expiryDate',
                sortDir: 'asc',
            };
            if (debouncedKeyword.trim()) params.keyword = debouncedKeyword.trim();
            if (batchNumberFilter.trim()) params.batchNumber = batchNumberFilter.trim();
            if (expiryFrom) params.expiryFrom = expiryFrom;
            if (expiryTo) params.expiryTo = expiryTo;

            const res = await inventoryAdminService.getBatches(params);
            const result = res.data?.result;
            setBatches(result?.content || []);
            setTotalPages(result?.totalPages || 0);
        } catch (error) {
            console.error(error);
            toast.error('Không tải được danh sách lô hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const h = () => setActiveDropdown(null);
        window.addEventListener('click', h);
        return () => window.removeEventListener('click', h);
    }, []);

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

    const getExpiryBadge = (expiryDate) => {
        if (!expiryDate) return null;
        const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        if (days <= 30) return <span className="ml-1 inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-red-50 text-red-600 border border-red-100">≤30 ngày</span>;
        if (days <= 90) return <span className="ml-1 inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-amber-50 text-amber-600 border border-amber-100">≤90 ngày</span>;
        return null;
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-6 text-[#1C2434] font-satoshi">
            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>

            <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h2 className="text-xl font-bold text-[#1C2434]">Danh sách lô hàng</h2>
                <p className="text-xs text-[#64748B]">Home &gt; Quản lý kho &gt; Lô hàng</p>
            </div>

            <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0]">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-3 border-b border-[#E2E8F0]">
                    <div>
                        <h2 className="text-lg text-start font-bold text-[#1C2434]">Lô hàng</h2>
                        <p className="text-xs text-[#64748B] mt-0.5">Quản lý tồn kho theo lô thuốc (FEFO)</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/inventory/import')}
                        className="flex items-center gap-1.5 bg-[#3C50E0] text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-opacity-90 transition-all"
                    >

                        Nhập kho
                    </button>
                </div>

                {/* Filter */}
                <div className="p-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                    <div className="relative w-full lg:w-72">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                            <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            className="w-full bg-white border border-[#E2E8F0] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#1C2434] placeholder-[#8A99AD] focus:outline-none focus:border-[#3C50E0] transition-all"
                            placeholder="Tên sản phẩm, SKU, số lô..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm !== debouncedKeyword && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                                <div className="animate-spin w-3 h-3 border-2 border-[#3C50E0] border-t-transparent rounded-full" />
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                        <input
                            type="text"
                            className="bg-white border border-[#E2E8F0] rounded-md px-2 py-1.5 text-xs text-[#1C2434] placeholder-[#8A99AD] focus:outline-none focus:border-[#3C50E0] transition-all w-32"
                            placeholder="Số lô..."
                            value={batchNumberFilter}
                            onChange={(e) => { setBatchNumberFilter(e.target.value); setPage(0); }}
                        />
                        <div className="flex items-center gap-1">
                            <input
                                type="date"
                                className="bg-white border border-[#E2E8F0] rounded-md px-2 py-1.5 text-xs text-[#1C2434] focus:outline-none focus:border-[#3C50E0] transition-all"
                                value={expiryFrom}
                                onChange={(e) => { setExpiryFrom(e.target.value); setPage(0); }}
                            />
                            <span className="text-[#8A99AD] text-xs">→</span>
                            <input
                                type="date"
                                className="bg-white border border-[#E2E8F0] rounded-md px-2 py-1.5 text-xs text-[#1C2434] focus:outline-none focus:border-[#3C50E0] transition-all"
                                value={expiryTo}
                                onChange={(e) => { setExpiryTo(e.target.value); setPage(0); }}
                            />
                        </div>
                        {(searchTerm || batchNumberFilter || expiryFrom || expiryTo) && (
                            <button
                                onClick={() => { setSearchTerm(''); setDebouncedKeyword(''); setBatchNumberFilter(''); setExpiryFrom(''); setExpiryTo(''); setPage(0); }}
                                className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1.5 rounded-md hover:bg-red-50 transition-all"
                            >
                                Xóa filter
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="p-10 text-center text-[#64748B] text-xs">
                        <div className="animate-spin inline-block w-5 h-5 border-[2.5px] border-current border-t-transparent text-[#3C50E0] rounded-full mr-2" />
                        Đang tải lô hàng...
                    </div>
                ) : (
                    <>
                        <div className="max-w-full overflow-x-auto no-scrollbar">
                            <table className="w-full table-auto text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#E2E8F0] bg-[#F7F9FC] text-xs font-semibold text-[#64748B]">
                                        <th className="p-2.5 pl-4 uppercase tracking-wider font-bold">Số lô</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Sản phẩm / Variant</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Tồn kho</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Giá nhập</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Hạn dùng</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">NSX</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Ngưỡng cảnh báo</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold text-right pr-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-[#E2E8F0]">
                                    {batches.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center p-8 text-[#64748B] font-medium">
                                                Không có lô hàng nào phù hợp với điều kiện lọc.
                                            </td>
                                        </tr>
                                    ) : batches.map((batch) => (
                                        <tr key={batch.id} className="hover:bg-[#F8FAFC] transition-colors">
                                            <td className="p-2.5 pl-4 font-semibold text-[#3C50E0]">{batch.batchNumber}</td>
                                            <td className="p-2.5">
                                                <div className="font-semibold text-[#1C2434] truncate max-w-[200px]">{batch.productName}</div>
                                                <div className="text-[10px] text-[#64748B] mt-0.5">{batch.variantName} · {batch.sku}</div>
                                            </td>
                                            <td className="p-2.5">
                                                <span className={`font-bold ${batch.lowStockAlert ? 'text-amber-600' : 'text-[#1C2434]'}`}>
                                                    {batch.remainingQuantity?.toLocaleString('vi-VN')}
                                                </span>
                                                {batch.lowStockAlert && (
                                                    <span className="ml-1 inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-amber-50 text-amber-600 border border-amber-100">Thấp</span>
                                                )}
                                            </td>
                                            <td className="p-2.5 text-[#64748B]">{batch.importPrice?.toLocaleString('vi-VN')}đ</td>
                                            <td className="p-2.5">
                                                <span>{formatDate(batch.expiryDate)}</span>
                                                {getExpiryBadge(batch.expiryDate)}
                                            </td>
                                            <td className="p-2.5 text-[#64748B]">{formatDate(batch.manufactureDate)}</td>
                                            <td className="p-2.5 text-[#64748B]">{batch.lowStockThreshold ?? '—'}</td>
                                            <td className="p-2.5 text-right pr-4 relative" style={{ zIndex: activeDropdown === batch.id ? 40 : 'auto' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === batch.id ? null : batch.id); }}
                                                    className="text-[#64748B] hover:text-[#1C2434] p-1 rounded-full hover:bg-[#F1F5F9] transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                </button>
                                                {activeDropdown === batch.id && (
                                                    <div className="absolute right-4 top-[80%] w-32 bg-white border border-[#E2E8F0] rounded shadow-xl py-1 z-[100] text-left">
                                                        <button
                                                            onClick={() => navigate(`/admin/inventory/batches/${batch.id}`)}
                                                            className="w-full px-3 py-1.5 text-xs text-[#1C2434] hover:bg-[#F8FAFC] transition-colors"
                                                        >
                                                            Chi tiết
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/admin/inventory/batches/${batch.id}/edit`)}
                                                            className="w-full px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                                                        >
                                                            Chỉnh sửa
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
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

export default InventoryBatchListPage;
