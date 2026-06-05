import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import inventoryAdminService from '../../service/inventoryAdminService';

const OutOfStockPage = () => {
    const navigate = useNavigate();
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [size] = useState(15);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => { fetchOutOfStock(); }, [page]);

    const fetchOutOfStock = async () => {
        try {
            setLoading(true);
            const res = await inventoryAdminService.getOutOfStock({ page, size });
            const result = res.data?.result;
            setVariants(result?.content || []);
            setTotalPages(result?.totalPages || 0);
        } catch (error) {
            console.error(error);
            toast.error('Không tải được danh sách hết hàng');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-6 text-[#1C2434] font-satoshi">
            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>

            <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h2 className="text-start text-xl font-bold text-[#1C2434]">Sản phẩm hết hàng</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">Variant không còn tồn kho khả dụng nào</p>
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-xs text-[#64748B]">Home &gt; Quản lý kho &gt; Hết hàng</p>
                    <button
                        onClick={() => navigate('/admin/inventory/import')}
                        className="flex items-center gap-1.5 bg-[#3C50E0] text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-opacity-90 transition-all"
                    >
                        Nhập kho
                    </button>
                </div>
            </div>

            <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0]">
                <div className="p-3 border-b border-[#E2E8F0] flex items-center gap-2">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
                        {variants.length} variant hết hàng (trang này)
                    </span>
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
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Phân loại (Variant)</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">SKU</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Giá bán</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Tổng tồn</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Trạng thái</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold text-right pr-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-[#E2E8F0]">
                                    {variants.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center p-8 text-green-600 font-medium">
                                                ✓ Tất cả variant đều còn hàng!
                                            </td>
                                        </tr>
                                    ) : variants.map((v) => (
                                        <tr key={v.variantId} className="hover:bg-[#F8FAFC] transition-colors">
                                            {/* Thay max-w-[200px] bằng max-w-[320px] hoặc kích thước bạn muốn */}
                                            <td className="p-2.5 pl-4 font-medium text-[#1C2434] max-w-[320px] truncate">
                                                {v.productName}
                                                <span className="block text-xs text-[#64748B]">ID: {v.variantId}</span>
                                            </td>
                                            <td className="p-2.5 text-[#64748B]">{v.variantName}</td>
                                            <td className="p-2.5 font-semibold text-[#3C50E0]">{v.sku}</td>
                                            <td className="p-2.5 text-[#64748B]">{v.price?.toLocaleString('vi-VN')}đ</td>
                                            <td className="p-2.5">
                                                <span className="font-bold text-red-600">0</span>
                                            </td>
                                            <td className="p-2.5">
                                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600 border border-red-100">Hết hàng</span>
                                                {!v.active && <span className="ml-1 inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 text-[#64748B] border border-[#E2E8F0]">Không kích hoạt</span>}
                                            </td>
                                            <td className="p-2.5 text-center pr-4">
                                                <button
                                                    onClick={() => navigate('/admin/inventory/import')}
                                                    className="text-xs text-[#3C50E0] hover:underline"
                                                >
                                                    Nhập hàng
                                                </button>
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

export default OutOfStockPage;
