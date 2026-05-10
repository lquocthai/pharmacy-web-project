import { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Star } from 'lucide-react';

/**
 * Form tạo đánh giá mới
 * Props:
 *   onSubmit: ({ star, comment }) => Promise<void>
 */
const RatingForm = ({ onSubmit }) => {
    const [star, setStar] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (star === 0) return alert('Vui lòng chọn số sao');
        setLoading(true);
        try {
            await onSubmit({ star, comment });
            setStar(0);
            setComment('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border rounded-3 p-4 mb-4 bg-white">
            <p className="fw-bold mb-3 text-start">Viết đánh giá của bạn</p>
            <Form onSubmit={handleSubmit}>
                {/* Chọn sao */}
                <div className="d-flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={28}
                            fill={(hovered || star) >= s ? '#f59e0b' : 'none'}
                            color="#f59e0b"
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setHovered(s)}
                            onMouseLeave={() => setHovered(0)}
                            onClick={() => setStar(s)} />
                    ))}
                    {star > 0 && (
                        <span className="ms-2 small text-muted align-self-center">
                            {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'][star]}
                        </span>
                    )}
                </div>

                {/* Nội dung */}
                <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="mb-3"
                />

                <Button type="submit" variant="primary"
                    style={{ backgroundColor: '#1250dc', border: 'none' }}
                    disabled={loading || star === 0}>
                    {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
                </Button>
            </Form>
        </div>
    );
};

export default RatingForm;
