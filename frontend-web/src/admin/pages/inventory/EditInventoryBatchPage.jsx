import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import inventoryAdminService from '../../service/inventoryAdminService';
import BackButton from '../../../components/Common/BackButton';

const today = new Date().toISOString().split('T')[0];

const EditInventoryBatchPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Read-only info
    const [batchInfo, setBatchInfo] = useState(null);

    // Editable fields only
    const [form, setForm] = useState({
        expiryDate: '',
        manufactureDate: '',
        lowStockThreshold: '',
    });

    useEffect(() => {
        if (id) fetchBatch();
    }, [id]);

    const fetchBatch = async () => {
        try {
            setFetchLoading(true);
            const res = await inventoryAdminService.getBatchById(id);
            const batch = res.data?.result;
            setBatchInfo(batch);
            setForm({
                expiryDate: batch.expiryDate || '',
                manufactureDate: batch.manufactureDate || '',
                lowStockThreshold: batch.lowStockThreshold != null ? String(batch.lowStockThreshold) : '',
            });
        } catch (error) {
            console.error(error);
            toast.error('Không tải được thông tin lô hàng');
        } finally {
            setFetchLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.expiryDate) e.expiryDate = 'Hạn sử dụng không được trống';
        else if (form.expiryDate <= today) e.expiryDate = 'Hạn sử dụng phải sau ngày hôm nay';
        if (form.lowStockThreshold !== '' && Number(form.lowStockThreshold) < 0) e.lowStockThreshold = 'Ngưỡng không được âm';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        try {
            setLoading(true);
            const payload = {
                expiryDate: form.expiryDate,
                manufactureDate: form.manufactureDate || null,
                lowStockThreshold: form.lowStockThreshold !== '' ? Number(form.lowStockThreshold) : null,
            };
            await inventoryAdminService.updateBatch(id, payload);
            toast.success('Cập nhật lô hàng thành công!');
            navigate(`/admin/inventory/batches/${id}`);
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Cập nhật thất bại');
        } finally {
            setLoading(false);
        }
    };

    const fieldClass = (name) =>
        `w-full bg-white border rounded-md px-3 py-2 text-xs text-[#1C2434] placeholder-[#8A99AD] focus:outline-none transition-all ${errors[name] ? 'border-red-400 focus:border-red-500' : 'border-[#E2E8F0] focus:border-[#3C50E0]'}`;

    if (fetchLoading) return (
        <div className="min-h-screen bg-[#F1F5F9] p-6 flex items-center justify-center text-xs text-[#64748B]">
            <div className="animate-spin inline-block w-5 h-5 border-[2.5px] border-current border-t-transparent text-[#3C50E0] rounded-full mr-2" />
            Đang tải...
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-6 text-[#1C2434] font-satoshi">
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="text-start">
                    <h2 className="text-xl font-bold text-[#1C2434]">Chỉnh sửa lô hàng</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">Chỉ được sửa: HSD, NSX, ngưỡng cảnh báo</p>
                </div>
                <BackButton to="/admin/inventory/batches" />
            </div>

            <div className="max-w-4xl m-auto">
                <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0]">

                    {/* Read-only info */}
                    {batchInfo && (
                        <div style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }} className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                            <p className="text-xs font-semibold text-[#64748B] mb-2">Thông tin không thể sửa</p>
                            <div className="text-start grid grid-cols-2 gap-2 text-xs">
                                <div><span className="text-[#8A99AD]">Số lô:</span> <span className="font-semibold text-[#1C2434] ml-1">{batchInfo.batchNumber}</span></div>
                                <div><span className="text-[#8A99AD]">SKU:</span> <span className="font-semibold text-[#1C2434] ml-1">{batchInfo.sku}</span></div>
                                <div><span className="text-[#8A99AD]">Sản phẩm:</span> <span className="font-semibold text-[#1C2434] ml-1">{batchInfo.productName}</span></div>
                                <div><span className="text-[#8A99AD]">Variant:</span> <span className="font-semibold text-[#1C2434] ml-1">{batchInfo.variantName}</span></div>
                                <div><span className="text-[#8A99AD]">Tồn kho:</span> <span className="font-bold text-[#3C50E0] ml-1">{batchInfo.remainingQuantity?.toLocaleString('vi-VN')}</span></div>
                                <div><span className="text-[#8A99AD]">Giá nhập:</span> <span className="font-semibold text-[#1C2434] ml-1">{batchInfo.importPrice?.toLocaleString('vi-VN')}đ</span></div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-3 space-y-4">
                        {/* Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#1C2434] mb-1">Ngày sản xuất (NSX)</label>
                                <input type="date" name="manufactureDate" value={form.manufactureDate} onChange={handleChange} max={today} className={fieldClass('manufactureDate')} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[#1C2434] mb-1">Hạn sử dụng (HSD) <span className="text-red-500">*</span></label>
                                <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} min={today} className={fieldClass('expiryDate')} />
                                {errors.expiryDate && <p className="mt-1 text-[10px] text-red-500">{errors.expiryDate}</p>}
                            </div>
                        </div>

                        {/* lowStockThreshold */}
                        <div className="text-start">
                            <label className="block text-xs font-semibold text-[#1C2434] mb-1">Ngưỡng cảnh báo tồn thấp</label>
                            <input type="number" name="lowStockThreshold" value={form.lowStockThreshold} onChange={handleChange} placeholder="VD: 10" min="0" className={fieldClass('lowStockThreshold')} />
                            {errors.lowStockThreshold && <p className="mt-1 text-[10px] text-red-500">{errors.lowStockThreshold}</p>}
                            <p className="mt-1 text-[10px] text-[#8A99AD]">Khi tồn kho ≤ ngưỡng này, hệ thống cảnh báo tồn thấp.</p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-xs font-medium border border-[#E2E8F0] rounded-md text-[#64748B] hover:bg-[#F8FAFC] transition-all">Hủy</button>
                            <button type="submit" disabled={loading} className="px-4 py-2 text-xs font-medium bg-[#3C50E0] text-white rounded-md hover:bg-opacity-90 transition-all flex items-center gap-1.5 disabled:opacity-70">
                                {loading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                Lưu thay đổi
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditInventoryBatchPage;
