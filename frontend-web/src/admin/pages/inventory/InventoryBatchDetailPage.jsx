import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import inventoryAdminService from '../../service/inventoryAdminService';

const DetailRow = ({ label, value, highlight }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-[#F1F5F9] last:border-0">
        <span className="text-xs font-semibold text-[#64748B] w-48 flex-shrink-0">{label}</span>
        <span className={`text-sm mt-1 sm:mt-0 ${highlight ? 'font-bold text-[#3C50E0]' : 'text-[#1C2434]'}`}>{value ?? '—'}</span>
    </div>
);

const InventoryBatchDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (id) fetchBatch();
    }, [id]);

    const fetchBatch = async () => {
        try {
            setLoading(true);
            const res = await inventoryAdminService.getBatchById(id);
            setBatch(res.data?.result);
        } catch (error) {
            console.error(error);
            toast.error('Không tải được thông tin lô hàng');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : null;
    const formatDateTime = (d) => d ? new Date(d).toLocaleString('vi-VN') : null;

    const getDaysUntilExpiry = () => {
        if (!batch?.expiryDate) return null;
        const days = Math.ceil((new Date(batch.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return days;
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-6 text-[#1C2434] font-satoshi">
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h2 className="text-xl font-bold text-[#1C2434]">Chi tiết lô hàng</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/admin/inventory/batches')}
                        className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] text-[#1C2434] px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[#F8FAFC] transition-all"
                    >
                        ← Quay lại
                    </button>
                    {batch && (
                        <button
                            onClick={() => navigate(`/admin/inventory/batches/${id}/edit`)}
                            className="flex items-center gap-1.5 bg-[#3C50E0] text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-opacity-90 transition-all"
                        >
                            Chỉnh sửa
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="p-10 text-center text-[#64748B] text-xs">
                    <div className="animate-spin inline-block w-5 h-5 border-[2.5px] border-current border-t-transparent text-[#3C50E0] rounded-full mr-2" />
                    Đang tải...
                </div>
            ) : batch ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Main info */}
                    <div style={{ borderRadius: '1rem' }} className="lg:col-span-2 bg-white border border-[#E2E8F0] p-5">
                        <h3 className="text-sm font-bold text-[#1C2434] mb-4 pb-3 border-b border-[#E2E8F0]">Thông tin lô hàng</h3>
                        <DetailRow label="Số lô (Batch Number)" value={batch.batchNumber} highlight />
                        <DetailRow label="Sản phẩm" value={batch.productName} />
                        <DetailRow label="Phân loại (Variant)" value={batch.variantName} />
                        <DetailRow label="SKU" value={batch.sku} />
                        <DetailRow label="Tồn kho hiện tại" value={`${batch.remainingQuantity?.toLocaleString('vi-VN')} đơn vị`} highlight={batch.lowStockAlert} />
                        <DetailRow label="Ngưỡng tồn thấp" value={batch.lowStockThreshold != null ? `${batch.lowStockThreshold} đơn vị` : null} />
                        <DetailRow label="Giá nhập" value={batch.importPrice ? `${batch.importPrice.toLocaleString('vi-VN')}đ` : null} />
                        <DetailRow label="Ngày sản xuất (NSX)" value={formatDate(batch.manufactureDate)} />
                        <DetailRow label="Hạn sử dụng (HSD)" value={formatDate(batch.expiryDate)} />
                        <DetailRow label="Cập nhật tồn kho lần cuối" value={formatDateTime(batch.lastStockUpdate)} />
                    </div>

                    {/* Status sidebar */}
                    <div className="flex flex-col gap-4">
                        {/* Expiry status */}
                        <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0] p-5">
                            <h3 className="text-sm font-bold text-[#1C2434] mb-3">Trạng thái hạn dùng</h3>
                            {(() => {
                                const days = getDaysUntilExpiry();
                                if (days === null) return <p className="text-xs text-[#64748B]">Không có thông tin</p>;
                                if (days <= 0) return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">Đã hết hạn</span>;
                                if (days <= 30) return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">Còn {days} ngày — Rất gần hết hạn</span>;
                                if (days <= 90) return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">Còn {days} ngày — Sắp hết hạn</span>;
                                return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-100">Còn {days} ngày — Bình thường</span>;
                            })()}
                        </div>

                        {/* Stock status */}
                        <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0] p-5">
                            <h3 className="text-sm font-bold text-[#1C2434] mb-3">Trạng thái tồn kho</h3>
                            {batch.remainingQuantity === 0 ? (
                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">Hết hàng</span>
                            ) : batch.lowStockAlert ? (
                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">⚠ Tồn thấp — Cần nhập thêm</span>
                            ) : (
                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-100">✓ Bình thường</span>
                            )}
                        </div>

                        {/* Quick action */}
                        <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0] p-5">
                            <h3 className="text-sm font-bold text-[#1C2434] mb-3">Thao tác nhanh</h3>
                            <button
                                onClick={() => navigate('/admin/inventory/import')}
                                className="w-full flex items-center justify-center gap-1.5 bg-[#3C50E0] text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-opacity-90 transition-all"
                            >
                                Nhập thêm hàng
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-10 text-center text-[#64748B] text-xs">Không tìm thấy lô hàng.</div>
            )}
        </div>
    );
};

export default InventoryBatchDetailPage;
