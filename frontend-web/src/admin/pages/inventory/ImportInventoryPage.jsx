import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import inventoryAdminService from '../../service/inventoryAdminService';

const today = new Date().toISOString().split('T')[0];

const ImportInventoryPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({
        variantId: '',
        batchNumber: '',
        manufactureDate: '',
        expiryDate: '',
        importPrice: '',
        quantity: '',
        lowStockThreshold: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.variantId.trim()) e.variantId = 'variantId không được trống';
        if (!form.batchNumber.trim()) e.batchNumber = 'Số lô không được trống';
        if (!form.expiryDate) e.expiryDate = 'Hạn sử dụng không được trống';
        else if (form.expiryDate <= today) e.expiryDate = 'Hạn sử dụng phải sau ngày hôm nay';
        if (!form.importPrice || Number(form.importPrice) <= 0) e.importPrice = 'Giá nhập phải lớn hơn 0';
        if (!form.quantity || Number(form.quantity) < 1) e.quantity = 'Số lượng phải lớn hơn 0';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        try {
            setLoading(true);
            const payload = {
                variantId: form.variantId.trim(),
                batchNumber: form.batchNumber.trim(),
                manufactureDate: form.manufactureDate || null,
                expiryDate: form.expiryDate,
                importPrice: Number(form.importPrice),
                quantity: Number(form.quantity),
                lowStockThreshold: form.lowStockThreshold ? Number(form.lowStockThreshold) : null,
            };
            await inventoryAdminService.importStock(payload);
            toast.success('Nhập kho thành công!');
            navigate('/admin/inventory/batches');
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Nhập kho thất bại');
        } finally {
            setLoading(false);
        }
    };

    const fieldClass = (name) =>
        `w-full bg-white border rounded-md px-3 py-2 text-xs text-[#1C2434] placeholder-[#8A99AD] focus:outline-none transition-all ${errors[name] ? 'border-red-400 focus:border-red-500' : 'border-[#E2E8F0] focus:border-[#3C50E0]'}`;

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-0 md:p-6 text-[#1C2434] font-satoshi">
            <div className=" flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className='text-start'>
                    <h2 className="text-xl font-bold text-[#1C2434]">Nhập kho</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">Tạo lô mới hoặc cộng dồn vào lô đã có</p>
                </div>
                <p className="text-xs text-[#64748B]">Home &gt; Quản lý kho &gt; Nhập kho</p>
            </div>

            <div className="max-w-4xl m-auto text-start">
                <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0]">
                    <div className="p-4 border-b border-[#E2E8F0]">
                        <h2 className="text-sm font-bold text-[#1C2434]">Thông tin nhập kho</h2>
                        <p className="text-xs text-[#64748B] mt-0.5">
                            Nếu batchNumber đã tồn tại với cùng variantId → hệ thống sẽ cộng dồn số lượng.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-3 space-y-4">
                        {/* variantId */}
                        <div>
                            <label className="block text-xs font-semibold text-[#1C2434] mb-1">Variant ID <span className="text-red-500">*</span></label>
                            <input type="text" name="variantId" value={form.variantId} onChange={handleChange} placeholder="UUID của variant..." className={fieldClass('variantId')} />
                            {errors.variantId && <p className="mt-1 text-[10px] text-red-500">{errors.variantId}</p>}
                        </div>

                        {/* batchNumber */}
                        <div>
                            <label className="block text-xs font-semibold text-[#1C2434] mb-1">Số lô (Batch Number) <span className="text-red-500">*</span></label>
                            <input type="text" name="batchNumber" value={form.batchNumber} onChange={handleChange} placeholder="VD: BATCH-2025-001" className={fieldClass('batchNumber')} />
                            {errors.batchNumber && <p className="mt-1 text-[10px] text-red-500">{errors.batchNumber}</p>}
                        </div>

                        {/* Dates row */}
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

                        {/* Price & Qty row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#1C2434] mb-1">Giá nhập (VNĐ) <span className="text-red-500">*</span></label>
                                <input type="number" name="importPrice" value={form.importPrice} onChange={handleChange} placeholder="0" min="1" className={fieldClass('importPrice')} />
                                {errors.importPrice && <p className="mt-1 text-[10px] text-red-500">{errors.importPrice}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[#1C2434] mb-1">Số lượng nhập <span className="text-red-500">*</span></label>
                                <input type="number" name="quantity" value={form.quantity} onChange={handleChange} placeholder="0" min="1" className={fieldClass('quantity')} />
                                {errors.quantity && <p className="mt-1 text-[10px] text-red-500">{errors.quantity}</p>}
                            </div>
                        </div>

                        {/* lowStockThreshold */}
                        <div>
                            <label className="block text-xs font-semibold text-[#1C2434] mb-1">Ngưỡng cảnh báo tồn thấp</label>
                            <input type="number" name="lowStockThreshold" value={form.lowStockThreshold} onChange={handleChange} placeholder="VD: 10 (để trống nếu không cần)" min="0" className={fieldClass('lowStockThreshold')} />
                            <p className="mt-1 text-[10px] text-[#8A99AD]">Khi tồn kho ≤ ngưỡng này, hệ thống sẽ cảnh báo.</p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/inventory/batches')}
                                className="px-4 py-2 text-xs font-medium border border-[#E2E8F0] rounded-md text-[#64748B] hover:bg-[#F8FAFC] transition-all"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 text-xs font-medium bg-[#3C50E0] text-white rounded-md hover:bg-opacity-90 transition-all flex items-center gap-1.5 disabled:opacity-70"
                            >
                                {loading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                Xác nhận nhập kho
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ImportInventoryPage;
