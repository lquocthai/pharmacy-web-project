import { Star, Trash2 } from 'lucide-react';

/**
 * Hiển thị 1 đánh giá
 * Props:
 *   rating: RatingResponse
 *   isOwner: boolean
 *   onDelete: (ratingId) => void
 */
const RatingItem = ({ rating, isOwner, onDelete }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    return (
        <div className="border-bottom py-3">
            <div className="d-flex justify-content-between align-items-start">
                <div>
                    {/* Tên + sao */}
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                            style={{ width: 36, height: 36, fontSize: 14 }}>
                            {rating.username?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <div className="fw-bold small text-start">{rating.username}</div>
                            <div className="d-flex gap-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} size={12}
                                        fill={s <= rating.star ? '#f59e0b' : 'none'}
                                        color="#f59e0b" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small">{formatDate(rating.createdAt)}</span>
                    {isOwner && (
                        <button className="btn btn-sm btn-outline-danger p-1"
                            onClick={() => onDelete(rating.id)}
                            title="Xóa đánh giá">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Nội dung */}
            {rating.comment && (
                <p className="mb-2 mt-2 small text-start" style={{ whiteSpace: 'pre-line' }}>
                    {rating.comment}
                </p>
            )}

            {/* Replies của dược sĩ */}
            {rating.replies?.length > 0 && (
                <div className="ms-4 mt-2">
                    {rating.replies.map(reply => (
                        <div key={reply.id}
                            className="bg-light rounded-3 p-3 mb-2 border-start border-primary border-3">
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <span className="badge bg-primary small">Dược sĩ</span>
                                <span className="fw-bold small">{reply.repliedByUsername}</span>
                                <span className="text-muted small">{formatDate(reply.createdAt)}</span>
                            </div>
                            <p className="mb-0 small text-start">{reply.content}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RatingItem;
