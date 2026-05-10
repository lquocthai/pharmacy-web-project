import { Star } from 'lucide-react';

/**
 * Hiển thị tổng hợp rating: điểm trung bình + thanh phân bổ 1-5 sao
 * Props:
 *   summary: { averageRating, totalRatings, ratingBreakdown: { 1:n, 2:n, ... } }
 */
const RatingSummary = ({ summary }) => {
    if (!summary || summary.totalRatings === 0) {
        return <p className="text-muted">Chưa có đánh giá nào.</p>;
    }

    const { averageRating, totalRatings, ratingBreakdown } = summary;

    return (
        <div className="d-flex gap-4 align-items-start p-4 border rounded-3 bg-white">
            {/* Điểm trung bình */}
            <div className="text-center flex-shrink-0">
                <div className="display-4 fw-bold text-warning">{averageRating}</div>
                <div className="d-flex justify-content-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={16}
                            fill={s <= Math.round(averageRating) ? '#f59e0b' : 'none'}
                            color="#f59e0b" />
                    ))}
                </div>
                <div className="text-muted small">{totalRatings} đánh giá</div>
            </div>

            {/* Thanh phân bổ */}
            <div className="flex-grow-1">
                {[5, 4, 3, 2, 1].map(star => {
                    const count = ratingBreakdown[star] || 0;
                    const percent = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                    return (
                        <div key={star} className="d-flex align-items-center gap-2 mb-1">
                            <span className="small text-muted" style={{ width: 30 }}>{star} ★</span>
                            <div className="flex-grow-1 bg-light rounded-pill overflow-hidden"
                                style={{ height: 8 }}>
                                <div className="bg-warning rounded-pill h-100"
                                    style={{ width: `${percent}%`, transition: 'width 0.3s' }} />
                            </div>
                            <span className="small text-muted" style={{ width: 24 }}>{count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RatingSummary;
