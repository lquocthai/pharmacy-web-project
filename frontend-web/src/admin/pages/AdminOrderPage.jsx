import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import orderAdminService from '../service/orderAdminService';

const AdminOrderPage = () => {
    const navigate = useNavigate();

    // ─────────────────────────────────────────────
    // STATES
    // ─────────────────────────────────────────────
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    // Tìm kiếm & Debounce
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedKeyword, setDebouncedKeyword] = useState('');

    // Bộ lọc chuyên biệt
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

    // Pagination
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    // Dropdown Action State
    const [activeDropdown, setActiveDropdown] = useState(null);

    // ── MODAL STATES ──
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    // Form Input States cho API Request
    const [newStatus, setNewStatus] = useState('');
    const [note, setNote] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // ─────────────────────────────────────────────
    // EFFECT: XỬ LÝ DEBOUNCE TÌM KIẾM 1 GIÂY
    // ─────────────────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(searchTerm);
            setPage(0);
        }, 1000);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // ─────────────────────────────────────────────
    // FETCH DATA
    // ─────────────────────────────────────────────
    useEffect(() => {
        fetchOrders();
    }, [page, statusFilter, paymentStatusFilter, debouncedKeyword]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = {
                page,
                size,
                keyword: debouncedKeyword.trim() || undefined,
                status: statusFilter || undefined,
                paymentStatus: paymentStatusFilter || undefined
            };

            const res = await orderAdminService.getOrders(params);
            const result = res.data?.result;

            setOrders(result?.content || []);
            setTotalPages(result?.totalPages || 0);
        } catch (error) {
            console.error(error);
            toast.error('Không tải được danh sách đơn hàng từ máy chủ');
        } finally {
            setLoading(false);
        }
    };

    // Đóng dropdown khi bấm ra ngoài vùng xử lý
    useEffect(() => {
        const handleOutsideClick = () => setActiveDropdown(null);
        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, []);

    // ─────────────────────────────────────────────
    // API ACTIONS HANDLER
    // ─────────────────────────────────────────────

    // 1. Xử lý Cập Nhật Trạng Thái
    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        if (!newStatus) {
            toast.error("Vui lòng chọn một trạng thái mới");
            return;
        }
        try {
            setActionLoading(true);
            // Khớp với @RequestBody UpdateOrderStatusRequest
            const requestBody = {
                status: newStatus,
                note: note.trim() || null
            };

            // Gọi hàm từ axios service (Vui lòng bổ sung updateStatus vào service của bạn nếu chưa có)
            await orderAdminService.updateStatus(selectedOrder.id, requestBody);

            toast.success("Cập nhật trạng thái đơn hàng thành công!");
            setIsUpdateModalOpen(false);
            setNewStatus('');
            setNote('');
            fetchOrders(); // Tải lại danh sách
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Cập nhật trạng thái thất bại");
        } finally {
            setActionLoading(false);
        }
    };

    // 2. Xử lý Hủy Đơn Hàng
    const handleCancelOrder = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            // Khớp với @RequestBody CancelOrderRequest
            const requestBody = {
                cancelReason: cancelReason.trim() || null
            };

            // Gọi hàm từ axios service
            await orderAdminService.cancelOrder(selectedOrder.id, requestBody);

            toast.success("Đã hủy đơn hàng thành công!");
            setIsCancelModalOpen(false);
            setCancelReason('');
            fetchOrders(); // Tải lại danh sách
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Hủy đơn hàng thất bại");
        } finally {
            setActionLoading(false);
        }
    };

    // ─────────────────────────────────────────────
    // FRONTEND VALIDATION LOGIC (Khớp cấu trúc Java switch-case của bạn)
    // ─────────────────────────────────────────────
    const getAvailableStatuses = (currentStatus) => {
        switch (currentStatus) {
            case 'PENDING':
                return [
                    { value: 'CONFIRMED', label: 'Xác nhận đơn hàng' },
                    { value: 'SHIPPING', label: 'Giao hàng cho vận chuyển' },
                    { value: 'DELIVERED', label: 'Giao hàng thành công' },
                    { value: 'CANCELLED', label: 'Hủy đơn hàng' }
                ];
            case 'CONFIRMED':
                return [
                    { value: 'SHIPPING', label: 'Giao hàng cho vận chuyển' },
                    { value: 'DELIVERED', label: 'Giao hàng thành công' },
                    { value: 'CANCELLED', label: 'Hủy đơn hàng' }
                ];
            case 'SHIPPING':
                return [
                    { value: 'DELIVERED', label: 'Giao hàng thành công' }
                ];
            case 'DELIVERED':
            case 'CANCELLED':
            default:
                return []; // Không được phép chuyển đi đâu nữa
        }
    };

    // ─────────────────────────────────────────────
    // HELPER FUNCTIONS (Badge màu sắc)
    // ─────────────────────────────────────────────
    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-100">Chờ xử lý</span>;
            case 'CONFIRMED':
                return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">Đã xác nhận</span>;
            case 'SHIPPING':
                return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">Đang giao</span>;
            case 'DELIVERED':
                return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">Thành công</span>;
            case 'CANCELLED':
                return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600 border border-red-100">Đã hủy</span>;
            default:
                return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100">{status}</span>;
        }
    };

    const getPaymentStatusBadge = (status) => {
        switch (status) {
            case 'PAID':
                return <span className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-[#DCFCE7] text-[#10B981]">Đã thanh toán</span>;
            case 'UNPAID':
                return <span className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-[#FEE2E2] text-[#EF4444]">Chưa thanh toán</span>;
            case 'REFUNDED':
                return <span className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-purple-100 text-purple-600">Đã hoàn tiền</span>;
            default:
                return <span className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-gray-100 text-gray-600">{status}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-0 md:p-6 text-[#1C2434] font-satoshi">
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Breadcrumb */}
            <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h2 className="text-xl font-bold text-[#1C2434]">Quản lý đơn hàng</h2>
                </div>
                <p className="text-xs text-[#64748B]">Home &gt; Danh sách đơn hàng</p>
            </div>

            <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0]">

                {/* ── 1. HEADER SECTION ── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-2 border-b border-[#E2E8F0]">
                    <div>
                        <h2 className="text-lg text-start font-bold text-[#1C2434]">Danh sách đơn hàng</h2>
                    </div>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button onClick={fetchOrders} className="flex items-center justify-center gap-1.5 bg-white border border-[#E2E8F0] text-[#1C2434] px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[#F8FAFC] transition-all">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Tải lại
                        </button>
                    </div>
                </div>

                {/* ── 2. FILTER BAR ── */}
                <div className="p-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col lg:flex-row justify-between items-center gap-3">
                    <div className="relative w-full lg:w-72">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                            <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            className="w-full bg-white border border-[#E2E8F0] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#1C2434] placeholder-[#8A99AD] focus:outline-none focus:border-[#3C50E0] transition-all"
                            placeholder="Mã đơn hàng, tên khách hàng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm !== debouncedKeyword && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                                <div className="animate-spin w-3 h-3 border-2 border-[#3C50E0] border-t-transparent rounded-full"></div>
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                        <select
                            className="bg-white border border-[#E2E8F0] rounded-md px-2 py-1.5 text-xs text-[#1C2434] focus:outline-none focus:border-[#3C50E0] transition-all min-w-[140px]"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(0);
                            }}
                        >
                            <option value="">Trạng thái đơn hàng</option>
                            <option value="PENDING">Chờ xử lý</option>
                            <option value="CONFIRMED">Đã xác nhận</option>
                            <option value="SHIPPING">Đang giao hàng</option>
                            <option value="DELIVERED">Thành công</option>
                            <option value="CANCELLED">Đã hủy</option>
                        </select>

                        <select
                            className="bg-white border border-[#E2E8F0] rounded-md px-2 py-1.5 text-xs text-[#1C2434] focus:outline-none focus:border-[#3C50E0] transition-all min-w-[160px]"
                            value={paymentStatusFilter}
                            onChange={(e) => {
                                setPaymentStatusFilter(e.target.value);
                                setPage(0);
                            }}
                        >
                            <option value="">Trạng thái thanh toán</option>
                            <option value="UNPAID">Chưa thanh toán</option>
                            <option value="PAID">Đã thanh toán</option>
                            <option value="REFUNDED">Đã hoàn tiền</option>
                        </select>

                        <button className="flex items-center gap-1.5 border border-[#E2E8F0] bg-white px-3 py-1.5 rounded-md text-xs font-medium text-[#1C2434] hover:bg-[#F8FAFC]">
                            <svg className="w-3.5 h-3.5 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                            </svg>
                            Filter
                        </button>
                    </div>
                </div>

                {/* ── 3. TABLE DATA SECTION ── */}
                {loading ? (
                    <div className="p-10 text-center text-[#64748B] font-medium text-xs">
                        <div className="animate-spin inline-block w-5 h-5 border-[2.5px] border-current border-t-transparent text-[#3C50E0] rounded-full mr-2" role="status"></div>
                        Đang tải danh sách đơn hàng...
                    </div>
                ) : (
                    <>
                        <div className="max-w-full overflow-x-auto no-scrollbar">
                            <table className="w-full table-auto text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#E2E8F0] bg-[#F7F9FC] text-xs font-semibold text-[#64748B]">
                                        <th className="py-2.5 pl-4 w-10">
                                            <input type="checkbox" className="rounded border-[#D2D6DC] text-[#3C50E0] focus:ring-[#3C50E0] w-3.5 h-3.5 cursor-pointer" />
                                        </th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Mã Đơn Hàng</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Khách Hàng</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Ngày Tạo</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Thanh Toán</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Tổng Tiền</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Trạng Thái</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold text-right pr-4">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-[#E2E8F0]">
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center p-8 text-[#64748B] font-medium">
                                                Không có đơn hàng nào phù hợp với điều kiện lọc.
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-[#F8FAFC] transition-colors">
                                                <td className="p-2.5 pl-4">
                                                    <input type="checkbox" className="rounded border-[#D2D6DC] text-[#3C50E0] focus:ring-[#3C50E0] w-3.5 h-3.5 cursor-pointer" />
                                                </td>
                                                <td className="p-2.5 font-semibold text-[#3C50E0] hover:underline cursor-pointer" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                                                    {order.orderCode}
                                                </td>
                                                <td className="p-2.5">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-[#1C2434]">{order.customerName}</span>
                                                        <span className="text-[10px] text-[#64748B]">{order.customerPhone || 'Không có SĐT'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-2.5 text-[#64748B]">
                                                    {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : 'N/A'}
                                                </td>
                                                <td className="p-2.5">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className="text-[11px] font-medium text-gray-700">⚡ {order.paymentMethod}</span>
                                                        {getPaymentStatusBadge(order.paymentStatus)}
                                                    </div>
                                                </td>
                                                <td className="p-2.5 font-bold text-[#1C2434]">
                                                    {order.finalAmount?.toLocaleString('vi-VN')}đ
                                                </td>
                                                <td className="p-2.5">
                                                    {getStatusBadge(order.status)}
                                                </td>
                                                <td className="text-center p-2.5 text-right pr-4 relative" style={{ zIndex: activeDropdown === order.id ? 40 : 'auto' }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveDropdown(activeDropdown === order.id ? null : order.id);
                                                        }}
                                                        className="items-center text-[#64748B] hover:text-[#1C2434] p-1 rounded-full hover:bg-[#F1F5F9] transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                    </button>

                                                    {activeDropdown === order.id && (
                                                        <div className="absolute right-4 top-[80%] w-32 bg-white border border-[#E2E8F0] rounded shadow-xl py-1 z-[100] text-left token-dropdown">
                                                            <button
                                                                onClick={() => navigate(`/admin/orders/detail/${order.orderCode}`)}
                                                                className="w-full px-3 py-1.5 text-xs text-[#1C2434] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5"
                                                            >
                                                                Chi tiết
                                                            </button>

                                                            {/* Chỉ hiển thị Cập nhật nếu đơn hàng KHÔNG PHẢI DELIVERED/CANCELLED */}
                                                            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedOrder(order);
                                                                        setNewStatus('');
                                                                        setNote('');
                                                                        setIsUpdateModalOpen(true);
                                                                    }}
                                                                    className="w-full px-3 py-1.5 text-xs hover:bg-gray-50 text-blue-600 font-medium transition-colors flex items-center gap-1.5"
                                                                >
                                                                    Cập nhật
                                                                </button>
                                                            )}

                                                            {/* Chỉ cho phép Hủy nếu đơn hàng đang ở PENDING hoặc CONFIRMED */}
                                                            {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedOrder(order);
                                                                        setCancelReason('');
                                                                        setIsCancelModalOpen(true);
                                                                    }}
                                                                    className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 font-medium transition-colors flex items-center gap-1.5"
                                                                >
                                                                    Hủy đơn
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* ── 4. PAGINATION BAR ── */}
                        <div className="flex justify-between items-center px-4 py-3 border-t border-[#E2E8F0] bg-white relative z-10">
                            <span className="text-xs text-[#64748B]">Trang {page + 1}/{totalPages || 1}</span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    className="px-2.5 py-1 text-[11px] font-medium border border-[#E2E8F0] rounded text-[#1C2434] bg-white hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    disabled={page === 0}
                                    onClick={(e) => { e.preventDefault(); setPage(prev => prev - 1); }}
                                >
                                    Trước
                                </button>
                                <button
                                    className="px-2.5 py-1 text-[11px] font-medium border border-[#E2E8F0] rounded text-[#1C2434] bg-white hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    disabled={page + 1 >= totalPages}
                                    onClick={(e) => { e.preventDefault(); setPage(prev => prev + 1); }}
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ─────────────────────────────────────────────
                MODAL 1: CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
                ───────────────────────────────────────────── */}
            {isUpdateModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-[#E2E8F0]">
                        <div className="bg-[#F8FAFC] px-5 py-4 border-b border-[#E2E8F0] flex justify-between items-center">
                            <h3 className="font-bold text-sm text-[#1C2434]">
                                Cập nhật đơn hàng: <span className="text-[#3C50E0]">{selectedOrder.orderCode}</span>
                            </h3>
                            <button
                                onClick={() => setIsUpdateModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateStatus} className="p-5 space-y-4">
                            <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-100 text-xs">
                                <p className="text-gray-600">Trạng thái hiện tại: {getStatusBadge(selectedOrder.status)}</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-[#1C2434]">Chọn trạng thái mới <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs text-[#1C2434] focus:outline-none focus:border-[#3C50E0] focus:ring-1 focus:ring-[#3C50E0] transition-all"
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                >
                                    <option value="">-- Chọn bước tiếp theo --</option>
                                    {getAvailableStatuses(selectedOrder.status).map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-[#1C2434]">Ghi chú (Note)</label>
                                <textarea
                                    rows="3"
                                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs text-[#1C2434] placeholder-[#8A99AD] focus:outline-none focus:border-[#3C50E0] transition-all"
                                    placeholder="Nhập ghi chú cập nhật nội bộ nếu có..."
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => setIsUpdateModalOpen(false)}
                                    className="px-4 py-2 text-xs font-medium border border-[#E2E8F0] rounded-md text-[#64748B] hover:bg-gray-50 transition-all disabled:opacity-50"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-xs font-medium bg-[#3C50E0] text-white rounded-md hover:bg-[#2A3BB7] transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-70"
                                >
                                    {actionLoading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    Xác nhận lưu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─────────────────────────────────────────────
                MODAL 2: XÁC NHẬN HỦY ĐƠN HÀNG
                ───────────────────────────────────────────── */}
            {isCancelModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-[#E2E8F0]">
                        <div className="bg-red-50/50 px-5 py-4 border-b border-red-100 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-red-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h3 className="font-bold text-sm">Xác nhận hủy đơn hàng</h3>
                            </div>
                            <button
                                onClick={() => setIsCancelModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleCancelOrder} className="p-5 space-y-4">
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Bạn có chắc chắn muốn hủy đơn hàng <strong className="text-[#1C2434]">{selectedOrder.orderCode}</strong> của khách hàng <span className="font-semibold">{selectedOrder.customerName}</span>? Hành động này không thể hoàn tác.
                            </p>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-[#1C2434]">Lý do hủy đơn</label>
                                <textarea
                                    rows="3"
                                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs text-[#1C2434] placeholder-[#8A99AD] focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                                    placeholder="Vui lòng nhập lý do hủy đơn (Khách đổi ý, Sai thông tin...)"
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => setIsCancelModalOpen(false)}
                                    className="px-4 py-2 text-xs font-medium border border-[#E2E8F0] rounded-md text-[#64748B] hover:bg-gray-50 transition-all"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-70"
                                >
                                    {actionLoading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    Xác nhận hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrderPage;