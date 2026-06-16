import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import inventoryAdminService from '../../service/inventoryAdminService';

const StatCard = ({ title, value, subtitle, icon, color, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white border border-[#E2E8F0] rounded-xl p-5 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-xs text-[#64748B] font-medium">{title}</p>
            <p className="text-2xl font-bold text-[#1C2434] mt-0.5">{value?.toLocaleString('vi-VN') ?? '—'}</p>
            {subtitle && <p className="text-[10px] text-[#8A99AD] mt-0.5">{subtitle}</p>}
        </div>
    </div>
);

const InventoryDashboardPage = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const res = await inventoryAdminService.getDashboard();
            setData(res.data?.result);
        } catch (error) {
            console.error(error);
            toast.error('Không tải được dữ liệu dashboard kho');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-0 md:p-6 text-[#1C2434] font-satoshi">
            {/* Breadcrumb */}
            <div className="mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="text-start">
                    <h2 className="text-xl font-bold text-[#1C2434]">Dashboard Kho</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">Tổng quan tình trạng tồn kho nhà thuốc</p>
                </div>
                <p className="text-xs text-[#64748B]">Home &gt; Quản lý kho &gt; Dashboard</p>
            </div>

            {loading ? (
                <div className="p-10 text-center text-[#64748B] text-xs">
                    <div className="animate-spin inline-block w-5 h-5 border-[2.5px] border-current border-t-transparent text-[#3C50E0] rounded-full mr-2" />
                    Đang tải dashboard...
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <StatCard
                            title="Tổng số biến thể sản phẩm"
                            value={data?.totalVariants}
                            subtitle="Tổng phân loại sản phẩm"
                            color="bg-[#EBF0FF]"
                            icon={
                                <svg className="w-6 h-6 text-[#3C50E0]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Tổng số Lô hàng"
                            value={data?.totalBatches}
                            subtitle="Tất cả lô trong hệ thống"
                            color="bg-[#F0FDF4]"
                            icon={
                                <svg className="w-6 h-6 text-[#10B981]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Tổng tồn kho"
                            value={data?.totalStock}
                            subtitle="Số lượng khả dụng (chưa hết hạn)"
                            color="bg-[#EFF6FF]"
                            icon={
                                <svg className="w-6 h-6 text-[#3B82F6]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Lô tồn thấp"
                            value={data?.lowStockBatches}
                            subtitle="Cần nhập thêm hàng"
                            color="bg-amber-50"
                            onClick={() => navigate('/admin/inventory/low-stock')}
                            icon={
                                <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Lô sắp hết hạn"
                            value={data?.expiringBatches}
                            subtitle="Trong 90 ngày tới"
                            color="bg-orange-50"
                            onClick={() => navigate('/admin/inventory/expiring')}
                            icon={
                                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Sản phẩm hết hàng"
                            value={data?.outOfStockVariants}
                            subtitle="Tổng tồn kho = 0"
                            color="bg-red-50"
                            onClick={() => navigate('/admin/inventory/out-of-stock')}
                            icon={
                                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            }
                        />
                    </div>

                    {/* Quick Actions */}
                    <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0] p-3">
                        {/* <h2 className="text-start text-sm font-bold text-[#1C2434] mb-4">Thao tác nhanh</h2> */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => navigate('/admin/inventory/import')}
                                className="flex items-center gap-2 bg-[#3C50E0] text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-opacity-90 transition-all"
                            >

                                Nhập kho
                            </button>
                            <button
                                onClick={() => navigate('/admin/inventory/batches')}
                                className="flex items-center gap-2 bg-white border border-[#E2E8F0] text-[#1C2434] px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#F8FAFC] transition-all"
                            >
                                <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                                Danh sách lô hàng
                            </button>
                            <button
                                onClick={() => navigate('/admin/inventory/transactions')}
                                className="flex items-center gap-2 bg-white border border-[#E2E8F0] text-[#1C2434] px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#F8FAFC] transition-all"
                            >
                                <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Lịch sử giao dịch
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default InventoryDashboardPage;
