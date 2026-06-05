import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ratingPharmacistService from '../service/ratingPharmacistService';

const formatTime = (value) => value ? new Date(value).toLocaleString('vi-VN') : '—';

const renderStars = (star) => (
    <div className="flex items-center gap-0.5 text-amber-400">
        {Array.from({ length: 5 }).map((_, index) => (
            <svg
                key={index}
                className={`h-4 w-4 ${index < Number(star || 0) ? 'fill-current' : 'fill-none text-[#CBD5E1]'}`}
                viewBox="0 0 20 20"
                stroke="currentColor"
                strokeWidth="1.5"
            >
                <path d="M10 1.8l2.5 5.1 5.6.8-4 3.9.9 5.5-5-2.7-5 2.7.9-5.5-4-3.9 5.6-.8L10 1.8z" />
            </svg>
        ))}
    </div>
);

export default function ReviewDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [rating, setRating] = useState(null);
    const [loading, setLoading] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchDetail = useCallback(async () => {
        try {
            setLoading(true);
            const res = await ratingPharmacistService.getRatingDetail(id);
            setRating(res.data?.result || null);
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được chi tiết đánh giá');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const handleSubmitReply = async (e) => {
        e.preventDefault();
        const content = replyContent.trim();

        if (!content) {
            toast.error('Vui lòng nhập nội dung trả lời');
            return;
        }

        try {
            setSubmitting(true);
            await ratingPharmacistService.replyRating(id, { content });
            toast.success('Đã trả lời đánh giá');
            setReplyContent('');
            fetchDetail();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không thể trả lời đánh giá');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] text-[#1C2434] font-satoshi">
            <div className="mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="text-start">
                    <h2 className="text-xl font-bold text-[#1C2434]">Chi tiết đánh giá</h2>                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/pharmacist/reviews')}
                        className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] text-[#1C2434] px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[#F8FAFC] transition-all"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        Quay lại
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0] p-10 text-center text-[#64748B] text-xs">
                    <div className="animate-spin inline-block w-5 h-5 border-[2.5px] border-current border-t-transparent text-[#3C50E0] rounded-full mr-2" />
                    Đang tải...
                </div>
            ) : rating ? (
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
                    <div className="space-y-4">
                        <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0] overflow-hidden">
                            <div className="border-b border-[#E2E8F0] px-4 py-3">
                                <h3 className="text-base font-bold text-[#1C2434]">Thông tin sản phẩm</h3>
                            </div>
                            <div className="p-4 flex flex-col sm:flex-row gap-4">
                                <img
                                    src={rating.productImage}
                                    alt={rating.productName}
                                    className="h-24 w-24 rounded-md border border-[#E2E8F0] object-cover bg-[#F8FAFC] flex-shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-base font-bold text-[#1C2434]">{rating.productName || 'Sản phẩm'}</p>
                                    <p className="mt-1 text-xs text-[#8A99AD] break-all">{rating.productId}</p>
                                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
                                        <span className="font-semibold text-[#1C2434]">{rating.userFullName || 'Khách hàng'}</span>
                                        <span>{formatTime(rating.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0] overflow-hidden">
                            <div className="border-b border-[#E2E8F0] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-base font-bold text-[#1C2434]">Nội dung đánh giá</h3>
                                {rating.status && (
                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border bg-slate-50 text-slate-600 border-slate-200">
                                        {rating.status}
                                    </span>
                                )}
                            </div>
                            <div className="p-4">
                                {renderStars(rating.star)}
                                <p className="mt-3 text-sm leading-6 text-[#1C2434] whitespace-pre-wrap">
                                    {rating.comment || 'Khách hàng chưa để lại nội dung đánh giá.'}
                                </p>
                            </div>
                        </div>

                        <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0] overflow-hidden">
                            <div className="border-b border-[#E2E8F0] px-4 py-3">
                                <h3 className="text-base font-bold text-[#1C2434]">Phản hồi ({rating.replies?.length || 0})</h3>
                            </div>
                            <div className="p-4 space-y-3">
                                {!rating.replies?.length ? (
                                    <p className="text-xs text-[#64748B]">Chưa có phản hồi nào.</p>
                                ) : rating.replies.map((reply) => (
                                    <div key={reply.replyId} className="rounded-md bg-[#F8FAFC] border border-[#E2E8F0] p-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-xs font-semibold text-[#1C2434]">{reply.pharmacistName || 'Dược sĩ'}</p>
                                            <p className="text-[11px] text-[#8A99AD]">{formatTime(reply.createdAt)}</p>
                                        </div>
                                        <p className="mt-2 text-sm leading-6 text-[#1C2434] whitespace-pre-wrap">{reply.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmitReply} style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0] p-4 h-fit">
                        <h3 className="text-base font-bold text-[#1C2434]">Trả lời đánh giá</h3>
                        <p className="text-[11px] text-[#8A99AD] mt-0.5">Phản hồi sẽ được hiển thị trong chi tiết đánh giá của sản phẩm.</p>
                        <textarea
                            id="replyContent"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            rows={7}
                            placeholder="Nhập nội dung phản hồi cho khách hàng"
                            className="mt-3 w-full resize-none rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#1C2434] outline-none focus:border-[#3C50E0]"
                        />
                        <div className="mt-3 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-3 py-1.5 rounded-md bg-[#3C50E0] text-xs font-medium text-white hover:bg-opacity-90 disabled:opacity-60 transition-all"
                            >
                                {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0] p-10 text-center text-[#64748B] text-xs">
                    Không tìm thấy đánh giá.
                </div>
            )}
        </div>
    );
}
