import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ratingPharmacistService from '../service/ratingPharmacistService';

const STAR_OPTIONS = [
    { label: 'Tất cả sao', value: '' },
    { label: '5 sao', value: '5' },
    { label: '4 sao', value: '4' },
    { label: '3 sao', value: '3' },
    { label: '2 sao', value: '2' },
    { label: '1 sao', value: '1' },
];

const STATUS_OPTIONS = [
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Hiển thị', value: 'ACTIVE' },
    { label: 'Ẩn', value: 'HIDDEN' },
];

const statusBadgeClass = {
    ACTIVE: 'bg-emerald-50 text-emerald-600 border-emerald-200 focus:ring-emerald-200',
    HIDDEN: 'bg-gray-100 text-gray-500 border-gray-200 focus:ring-gray-200',
};

const statusLabel = {
    ACTIVE: 'Hiển thị',
    HIDDEN: 'Ẩn',
};

const formatTime = (value) => value ? new Date(value).toLocaleString('vi-VN') : '—';

const renderStars = (star) => (
    <div className="flex items-center gap-0.5 text-amber-400" aria-label={`${star || 0} sao`}>
        {Array.from({ length: 5 }).map((_, index) => (
            <svg
                key={index}
                className={`h-3.5 w-3.5 ${index < Number(star || 0) ? 'fill-current' : 'fill-none text-[#CBD5E1]'}`}
                viewBox="0 0 20 20"
                stroke="currentColor"
                strokeWidth="1.5"
            >
                <path d="M10 1.8l2.5 5.1 5.6.8-4 3.9.9 5.5-5-2.7-5 2.7.9-5.5-4-3.9 5.6-.8L10 1.8z" />
            </svg>
        ))}
    </div>
);

export default function ReviewsPage() {
    const navigate = useNavigate();
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState(null); // State theo dõi phần tử đang chạy API update status
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        star: '',
        productName: '',
    });

    useEffect(() => {
        const handler = setTimeout(() => {
            setFilters(prev => {
                if (prev.productName !== searchTerm) {
                    setPage(0);
                    return { ...prev, productName: searchTerm };
                }
                return prev;
            });
        }, 1000);

        return () => clearTimeout(handler);
    }, [searchTerm]);

    const requestParams = useMemo(() => ({
        page,
        size: 2,
        ...(filters.status && { status: filters.status }),
        ...(filters.star && { star: Number(filters.star) }),
        ...(filters.productName.trim() && { productName: filters.productName.trim() }),
    }), [filters, page]);

    const fetchRatings = useCallback(async () => {
        try {
            setLoading(true);
            const res = await ratingPharmacistService.getRatings(requestParams);
            const result = res.data?.result;
            console.log(result)
            setRatings(result?.content || []);
            setTotalPages(result?.totalPages || 0);
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được danh sách đánh giá');
        } finally {
            setLoading(false);
        }
    }, [requestParams]);

    useEffect(() => {
        fetchRatings();
    }, [fetchRatings]);

    // Xử lý gọi API cập nhật trạng thái khi Dược sĩ tương tác đổi select option
    const handleStatusChange = async (ratingId, newStatus) => {
        try {
            setUpdatingId(ratingId);
            await ratingPharmacistService.updateRatingStatus(ratingId, newStatus);

            // Cập nhật lại UI local ngay lập tức mà không cần gọi lại fetchRatings toàn bộ danh sách
            setRatings(prevRatings =>
                prevRatings.map(item =>
                    item.id === ratingId ? { ...item, status: newStatus } : item
                )
            );
            toast.success('Cập nhật trạng thái đánh giá thành công!');
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Thay đổi trạng thái thất bại');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0);
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setFilters({ status: '', star: '', productName: '' });
        setPage(0);
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] text-[#1C2434] font-satoshi">
            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>

            <div className=" flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="text-start">
                    <h2 className="text-xl font-bold text-[#1C2434]">Quản lý đánh giá</h2>
                </div>
                <p className="text-xs text-[#64748B]">Home &gt; Đánh giá</p>
            </div>

            <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 border-b border-[#E2E8F0]">
                    <div>
                        <h2 className="text-base font-bold text-[#1C2434]">Danh sách đánh giá</h2>
                        <p className="text-start text-[11px] text-[#8A99AD] mt-0.5">{ratings.length} đánh giá trong trang hiện tại</p>
                    </div>
                    <button
                        onClick={fetchRatings}
                        className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] text-[#1C2434] px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[#F8FAFC] transition-all"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Làm mới
                    </button>
                </div>

                <div className="p-3 bg-[#F8FAFC] border-b border-[#E2E8F0] grid grid-cols-1 md:grid-cols-[1fr_150px_180px_auto] gap-2 items-center">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A99AD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
                        </svg>
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm theo tên sản phẩm"
                            className="w-full h-9 rounded-md border border-[#E2E8F0] bg-white pl-9 pr-3 text-xs text-[#1C2434] outline-none focus:border-[#3C50E0]"
                        />
                    </div>
                    <select
                        value={filters.star}
                        onChange={(e) => handleFilterChange('star', e.target.value)}
                        className="h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#1C2434] outline-none focus:border-[#3C50E0]"
                    >
                        {STAR_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#1C2434] outline-none focus:border-[#3C50E0]"
                    >
                        {STATUS_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleResetFilters}
                        className="h-9 px-3 rounded-md border border-[#E2E8F0] bg-white text-xs font-medium text-[#64748B] hover:bg-white hover:text-[#1C2434] transition-all"
                    >
                        Xóa lọc
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
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Khách hàng</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Đánh giá</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Trạng thái</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Thời gian</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold text-right pr-4">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-[#E2E8F0]">
                                    {ratings.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center p-8 text-[#64748B]">
                                                Không có đánh giá nào.
                                            </td>
                                        </tr>
                                    ) : ratings.map((rating) => (
                                        <tr key={rating.id} className="hover:bg-[#F8FAFC] transition-colors">
                                            <td className="p-2.5 pl-4 min-w-[280px]">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={rating.productImage}
                                                        alt={rating.productName}
                                                        className="h-10 w-10 rounded-md border border-[#E2E8F0] object-cover bg-[#F8FAFC] flex-shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-[#1C2434] line-clamp-2">{rating.productName || 'Sản phẩm'}</p>
                                                        <p className="text-[10px] text-[#8A99AD] truncate max-w-[220px]">{rating.productId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-2.5">
                                                <p className="font-semibold text-[#1C2434] whitespace-nowrap">{rating.userName || 'Khách hàng'}</p>
                                                <p className="text-[10px] text-[#8A99AD] truncate max-w-[120px]">{rating.userId}</p>
                                            </td>
                                            <td className="p-2.5">
                                                {renderStars(rating.star)}
                                            </td>

                                            {/* CỘT TRẠNG THÁI: Thay thế tag span cũ bằng một Select Box có tương tác */}
                                            <td className="p-2.5">
                                                {rating.status ? (
                                                    <div className="relative inline-flex items-center">
                                                        <select
                                                            disabled={updatingId === rating.id}
                                                            value={rating.status}
                                                            onChange={(e) => handleStatusChange(rating.id, e.target.value)}
                                                            className={`cursor-pointer appearance-none px-2.5 py-1 pr-6 rounded-full text-[10px] font-medium border outline-none transition-all focus:ring-1 ${statusBadgeClass[rating.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}
                                                        >
                                                            <option value="ACTIVE">{statusLabel.ACTIVE}</option>
                                                            <option value="HIDDEN">{statusLabel.HIDDEN}</option>
                                                        </select>
                                                        {updatingId === rating.id ? (
                                                            <div className="absolute right-1.5 animate-spin w-3 h-3 border border-current border-t-transparent text-slate-500 rounded-full" />
                                                        ) : (
                                                            <svg className="absolute right-1.5 w-3 h-3 pointer-events-none text-current opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[#8A99AD]">—</span>
                                                )}
                                            </td>

                                            <td className="p-2.5 text-[#64748B] whitespace-nowrap">
                                                {formatTime(rating.createdAt)}
                                            </td>
                                            <td className="p-2.5 text-center pr-4">
                                                <button
                                                    onClick={() => navigate(`/pharmacist/reviews/${rating.id}`)}
                                                    className="px-2.5 py-1 text-[11px] font-medium border border-[#E2E8F0] rounded text-[#1C2434] bg-white hover:bg-[#F8FAFC] transition-all"
                                                >
                                                    Chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center px-4 py-3 border-t border-[#E2E8F0] bg-white">
                            <span className="text-xs text-[#64748B]">Trang {page + 1}/{totalPages || 1}</span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    disabled={page === 0}
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    className="px-2.5 py-1 text-[11px] font-medium border border-[#E2E8F0] rounded text-[#1C2434] bg-white hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Trước
                                </button>
                                <button
                                    disabled={page + 1 >= totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-2.5 py-1 text-[11px] font-medium border border-[#E2E8F0] rounded text-[#1C2434] bg-white hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}