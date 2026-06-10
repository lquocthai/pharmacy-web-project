import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import orderAdminService from '../service/orderAdminService';
// Bản đồ màu sắc và nhãn hiển thị trạng thái đơn hàng
const orderStatusMap = {
    PENDING: { label: 'Chờ xử lý', className: 'bg-amber-50 text-amber-600 border-amber-200' },
    CONFIRMED: { label: 'Đã xác nhận', className: 'bg-blue-50 text-blue-600 border-blue-200' },
    SHIPPING: { label: 'Đang giao hàng', className: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    COMPLETED: { label: 'Đã hoàn thành', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    CANCELLED: { label: 'Đã hủy', className: 'bg-rose-50 text-rose-600 border-rose-200' },
};

// Bản đồ màu sắc và nhãn hiển thị trạng thái thanh toán
const paymentStatusMap = {
    UNPAID: { label: 'Chưa thanh toán', className: 'bg-gray-100 text-gray-600 border-gray-300' },
    PAID: { label: 'Đã thanh toán', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    REFUNDED: { label: 'Đã hoàn tiền', className: 'bg-purple-50 text-purple-600 border-purple-200' },
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatTime = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function OrderDetailPage() {
    const { orderCode } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                setLoading(true);
                // Giả định hàm gọi API của bạn có tên là getOrderDetail
                const res = await orderAdminService.getOrderByCode(orderCode);
                if (res.data?.code === 0) {
                    setOrder(res.data.result);
                } else {
                    toast.error('Không tìm thấy thông tin đơn hàng');
                }
            } catch (error) {
                console.error('Lỗi tải chi tiết đơn hàng:', error);
                toast.error(error?.response?.data?.message || 'Không thể tải chi tiết đơn hàng');
            } finally {
                setLoading(false);
            }
        };

        if (orderCode) {
            fetchOrderDetail();
        }
    }, [orderCode]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col justify-center items-center gap-3 text-slate-500 text-sm">
                <div className="animate-spin w-8 h-8 border-[3px] border-current border-t-transparent text-[#3C50E0] rounded-full" />
                <span>Đang tải thông tin đơn hàng...</span>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-[50vh] flex flex-col justify-center items-center gap-4 text-center p-4">
                <p className="text-slate-500 text-sm">Không tìm thấy dữ liệu cho đơn hàng này.</p>
                <button
                    onClick={() => navigate('/my-orders')}
                    className="px-4 py-2 bg-[#3C50E0] text-white text-xs font-medium rounded-md hover:bg-opacity-90 transition-all"
                >
                    Quay lại danh sách đơn hàng
                </button>
            </div>
        );
    }

    const currentStatus = orderStatusMap[order.status] || { label: order.status, className: 'bg-slate-100 text-slate-600 border-slate-300' };
    const currentPaymentStatus = paymentStatusMap[order.paymentStatus] || { label: order.paymentStatus, className: 'bg-slate-100 text-slate-600 border-slate-300' };

    return (
        <div className="max-w-5xl mx-auto p-4 bg-[#F1F5F9] text-[#1C2434] font-satoshi space-y-4">

            {/* Thanh tiêu đề hành động */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-[#E2E8F0]">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-xs text-[#64748B] hover:text-[#3C50E0] flex items-center gap-1 mb-1 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                        Quay lại
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-[#1C2434]">Mã đơn: {order.orderCode}</h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${currentStatus.className}`}>
                            {currentStatus.label}
                        </span>
                    </div>
                    <p className="text-[11px] text-[#8A99AD] mt-0.5">Ngày đặt hàng: {formatTime(order.createdAt)}</p>
                </div>

                {order.status === 'PENDING' && order.paymentStatus === 'UNPAID' && (
                    <button className="w-full sm:w-auto px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-md hover:bg-rose-700 transition-all shadow-sm">
                        Hủy đơn hàng
                    </button>
                )}
            </div>

            {/* Bố cục Grid 2 cột */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Cột trái: Sản phẩm & Thanh toán (Chiếm 2 phần) */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Danh sách sản phẩm */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                        <div className="p-4 border-b border-[#E2E8F0] bg-slate-50/50">
                            <h3 className="text-sm font-bold text-[#1C2434]">Sản phẩm đã đặt ({order.productCount})</h3>
                        </div>
                        <div className="divide-y divide-[#E2E8F0]">
                            {order.items?.map((item) => (
                                <div key={item.id} className="p-4 flex gap-3 sm:items-center hover:bg-[#F8FAFC] transition-colors">
                                    <img
                                        src={item.imageUrl}
                                        alt={item.productName}
                                        className="w-16 h-16 object-cover rounded-lg border border-[#E2E8F0] flex-shrink-0 bg-white"
                                    />
                                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                                        <div className="sm:col-span-2">
                                            <h4 className="font-semibold text-xs text-[#1C2434] line-clamp-2 hover:text-[#3C50E0] cursor-pointer"
                                                onClick={() => navigate(`/products/detail/${item.productSlug}`)}>
                                                {item.productName}
                                            </h4>
                                            <p className="text-[10px] text-[#8A99AD] mt-1">Đơn vị tính: <span className="font-medium text-[#64748B]">{item.variantName}</span></p>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <p className="text-xs font-bold text-[#1C2434]">{formatCurrency(item.priceAtTime)}</p>
                                            <p className="text-[11px] text-[#64748B]">Số lượng: x{item.quantity}</p>
                                            <p className="text-xs font-extrabold text-[#3C50E0] mt-0.5 sm:mt-1">Thành tiền: {formatCurrency(item.subtotal)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Lịch sử trạng thái đơn hàng */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                        <h3 className="text-sm font-bold text-[#1C2434] mb-3">Nhật ký đơn hàng</h3>
                        <div className="relative border-l border-slate-200 ml-2 pl-4 space-y-4">
                            {order.statusHistory?.map((history, idx) => (
                                <div key={history.id} className="relative">
                                    {/* Điểm mốc timeline */}
                                    <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${idx === 0 ? 'bg-[#3C50E0] animate-pulse' : 'bg-slate-300'}`} />
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-bold text-[#1C2434]">
                                                {orderStatusMap[history.status]?.label || history.status}
                                            </span>
                                            <span className="text-[10px] text-[#8A99AD]">{formatTime(history.changedAt)}</span>
                                        </div>
                                        <p className="text-[11px] text-[#64748B] mt-0.5">{history.note}</p>
                                        {history.changedBy && (
                                            <p className="text-[10px] text-slate-400 mt-0.5">Xử lý bởi: {history.changedBy}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Cột phải: Thông tin giao hàng & Tổng tiền (Chiếm 1 phần) */}
                <div className="space-y-4">

                    {/* Thông tin nhận hàng */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-3">
                        <h3 className="text-sm font-bold text-[#1C2434] border-b border-[#E2E8F0] pb-2">Thông tin nhận hàng</h3>
                        <div className="space-y-2 text-xs">
                            <div>
                                <p className="text-[#8A99AD] text-[10px]">Người nhận hàng</p>
                                <p className="font-bold text-[#1C2434] text-sm mt-0.5">{order.shippingFullName}</p>
                            </div>
                            <div>
                                <p className="text-[#8A99AD] text-[10px]">Số điện thoại</p>
                                <p className="font-semibold text-[#1C2434] mt-0.5">{order.shippingPhone}</p>
                            </div>
                            <div>
                                <p className="text-[#8A99AD] text-[10px]">Địa chỉ giao hàng</p>
                                <p className="text-[#64748B] leading-relaxed mt-0.5">{order.shippingFullAddress}</p>
                            </div>
                            {order.note && (
                                <div className="bg-amber-50 p-2 rounded border border-amber-100 mt-1">
                                    <p className="text-amber-800 text-[10px] font-bold">Ghi chú đơn hàng:</p>
                                    <p className="text-amber-700 text-[11px] italic mt-0.5">{order.note}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Thông tin thanh toán & Tổng tiền */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-3">
                        <h3 className="text-sm font-bold text-[#1C2434] border-b border-[#E2E8F0] pb-2">Thông tin thanh toán</h3>

                        <div className="flex justify-between items-center text-xs">
                            <span className="text-[#64748B]">Phương thức thanh toán:</span>
                            <span className="font-bold text-[#1C2434]">{order.paymentMethod}</span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                            <span className="text-[#64748B]">Trạng thái ví:</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${currentPaymentStatus.className}`}>
                                {currentPaymentStatus.label}
                            </span>
                        </div>

                        {order.paidAt && (
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-[#64748B]">Thời gian thanh toán:</span>
                                <span className="text-[#1C2434] font-medium">{formatTime(order.paidAt)}</span>
                            </div>
                        )}

                        <div className="border-t border-[#E2E8F0] pt-2.5 space-y-2 text-xs">
                            <div className="flex justify-between text-[#64748B]">
                                <span>Tiền hàng tổng:</span>
                                <span>{formatCurrency(order.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-[#64748B]">
                                <span>Phí vận chuyển:</span>
                                <span>{formatCurrency(order.shippingFee)}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-dashed border-[#E2E8F0] pt-2 text-[#1C2434]">
                                <span className="font-bold">Tổng thanh toán:</span>
                                <span className="text-base font-extrabold text-rose-600">{formatCurrency(order.finalAmount)}</span>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}