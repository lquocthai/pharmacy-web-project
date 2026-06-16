/**
 * Testimonials — "Khách Hàng Nói Gì?" — dữ liệu tĩnh
 * Dùng Swiper nếu cần scroll trên mobile, hoặc responsive row đơn giản.
 */

const REVIEWS = [
    {
        id: 1,
        name: 'Nguyễn Thảo Anh',
        avatar: '/images/avatars/avatar1.jpg',
        rating: 5,
        text: 'Dịch vụ giao hàng 2h quá tuyệt vời. Tôi đặt thuốc lúc 9h sáng, 10h30 đã nhận được. Dược sĩ tư vấn rất kỹ lưỡng về liều dùng.',
    },
    {
        id: 2,
        name: 'Trần Minh Hoàng',
        avatar: '/images/avatars/avatar2.jpg',
        rating: 5,
        text: 'Thuốc chính hãng, giá cả minh bạch. Tiện nhất là có thể lưu toa thuốc online để tái đặt hàng lần sau mà không cần tìm kiếm lại.',
    },
    {
        id: 3,
        name: 'Phạm Quỳnh Chi',
        avatar: '/images/avatars/avatar3.jpg',
        rating: 5,
        text: 'Giao diện dễ sử dụng, thanh toán nhanh gọn. Mình hay mua vitamin cho bố mẹ ở đây rất yên tâm về chất lượng.',
    },
];

function StarRating({ rating }) {
    return (
        <div className="d-flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
                <span
                    key={i}
                    className="material-icons"
                    style={{ fontSize: 16, color: i < rating ? '#F59E0B' : '#E5E7EB' }}
                >
                    star
                </span>
            ))}
        </div>
    );
}

export default function Testimonials() {
    return (
        <section className="py-5" style={{ background: '#fff' }}>
            <div className="container-xl">
                {/* Header */}
                <div className="text-center mb-5">
                    <h2
                        className="fw-bold mb-2"
                        style={{
                            fontFamily: 'Manrope, system-ui, sans-serif',
                            fontSize: 24,
                            color: '#191c1e',
                        }}
                    >
                        Khách Hàng Nói Gì?
                    </h2>
                    <p style={{ fontSize: 14, color: '#737686' }}>
                        Hơn 50.000+ gia đình đã tin dùng PharmaCare
                    </p>
                    <div
                        className="mx-auto"
                        style={{ width: 48, height: 3, background: '#2563EB', borderRadius: 2 }}
                    />
                </div>

                <div className="row g-4 justify-content-center">
                    {REVIEWS.map((review) => (
                        <div key={review.id} className="col-12 col-md-4">
                            <div
                                className="h-100 p-4 rounded-4 d-flex flex-column gap-3"
                                style={{
                                    background: '#f7f9fb',
                                    border: '1px solid #eceef0',
                                }}
                            >
                                {/* Stars */}
                                <StarRating rating={review.rating} />

                                {/* Quote */}
                                <p
                                    className="mb-0 text-start"
                                    style={{ fontSize: 14, color: '#434655', lineHeight: 1.7, flex: 1 }}
                                >
                                    "{review.text}"
                                </p>

                                {/* Author */}
                                <div className="d-flex align-items-center gap-3 pt-2 border-top">
                                    <img
                                        src={review.avatar}
                                        alt={review.name}
                                        className="rounded-circle flex-shrink-0"
                                        style={{ width: 40, height: 40, objectFit: 'cover', background: '#eceef0' }}
                                        onError={(e) => {
                                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.name)}&background=2563EB&color=fff&size=80`;
                                        }}
                                    />
                                    <span
                                        className="fw-semibold text-start"
                                        style={{ fontSize: 14, color: '#191c1e' }}
                                    >
                                        {review.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
