import { Spinner } from 'react-bootstrap';
import RatingItem from './RatingItem';

/**
 * Danh sách đánh giá + nút xem thêm
 * Props:
 *   ratings: RatingResponse[]
 *   loading: boolean
 *   isLast: boolean
 *   remaining: number  — số đánh giá còn lại chưa load
 *   onLoadMore: () => void
 *   currentUserId: string | null
 *   onDelete: (ratingId) => void
 */
const RatingList = ({ ratings, loading, isLast, remaining, onLoadMore, currentUserId, onDelete }) => {
    if (!loading && ratings.length === 0) {
        return <p className="text-muted py-3">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>;
    }

    return (
        <div>
            {ratings.map(rating => (
                <RatingItem
                    key={rating.id}
                    rating={rating}
                    isOwner={currentUserId && rating.userId === currentUserId}
                    onDelete={onDelete}
                />
            ))}

            {/* Loading spinner */}
            {loading && (
                <div className="text-center py-3">
                    <Spinner animation="border" size="sm" variant="primary" />
                </div>
            )}

            {/* Nút xem thêm */}
            {!loading && !isLast && remaining > 0 && (
                <div className="text-center mt-3">
                    <button className="btn btn-outline-primary px-4"
                        onClick={onLoadMore}>
                        Xem thêm {remaining} đánh giá
                    </button>
                </div>
            )}
        </div>
    );
};

export default RatingList;
