/**
 * HealthBlog — "Cẩm Nang Sức Khỏe" — 3 bài viết tĩnh (placeholder)
 * Khi có API blog thật, thay useState + useEffect để fetch dữ liệu.
 */

const ARTICLES = [
    {
        id: 1,
        category: 'LIFESTYLE',
        categoryColor: '#007D55',
        image: '/images/blog/blog1.jpg',
        title: '5 Thói Quen Buổi Sáng Giúp Tăng Cường Miễn Dịch',
        excerpt:
            'Cùng khám phá những bí quyết đơn giản giúp cơ thể bạn luôn tràn đầy năng lượng và đề kháng tốt...',
        to: '#',
    },
    {
        id: 2,
        category: 'NUTRITION',
        categoryColor: '#B45309',
        image: '/images/blog/blog2.jpg',
        title: 'Chế Độ Ăn Địa Trung Hải: Lợi Ích Cho Tim Mạch',
        excerpt:
            'Tại sao các bác sĩ luôn khuyến cáo chế độ ăn này cho những người gặp vấn đề về huyết áp?',
        to: '#',
    },
    {
        id: 3,
        category: 'FITNESS',
        categoryColor: '#6D28D9',
        image: '/images/blog/blog3.jpg',
        title: 'Bí Quyết Tập Luyện Tại Nhà Hiệu Quả Cho Người Bận Rộn',
        excerpt:
            'Dành ra 15 phút mỗi ngày theo lộ trình này, bạn sẽ thấy sự thay đổi rõ rệt trong 30 ngày.',
        to: '#',
    },
];

export default function HealthBlog() {
    return (
        <section className="py-5" style={{ background: '#f7f9fb' }}>
            <div className="container-xl">
                {/* Header */}
                <div className="d-flex align-items-end justify-content-between mb-4">
                    <div>
                        <h2
                            className="fw-bold mb-1 text-start"
                            style={{
                                fontFamily: 'Manrope, system-ui, sans-serif',
                                fontSize: 24,
                                color: '#191c1e',
                            }}
                        >
                            Cẩm Nang Sức Khỏe
                        </h2>
                        <div style={{ width: 48, height: 3, background: '#2563EB', borderRadius: 2 }} />
                    </div>
                </div>

                <div className="row g-4">
                    {ARTICLES.map((article) => (
                        <div key={article.id} className="col-12 col-md-4">
                            <a
                                href={article.to}
                                className="text-decoration-none d-flex flex-column h-100 rounded-4 overflow-hidden"
                                style={{
                                    background: '#fff',
                                    border: '1px solid #eceef0',
                                    boxShadow: '0 2px 8px rgba(37,99,235,0.04)',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(37,99,235,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.04)';
                                }}
                            >
                                {/* Image */}
                                <div style={{ height: 200, overflow: 'hidden', background: '#eceef0' }}>
                                    <img
                                        src={article.image}
                                        alt={article.title}
                                        className="w-100 h-100"
                                        style={{ objectFit: 'cover', transition: 'transform 0.4s' }}
                                        loading="lazy"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                                    />
                                </div>

                                {/* Body */}
                                <div className="p-4 d-flex flex-column gap-2 flex-grow-1">
                                    <span
                                        className="badge rounded-pill fw-bold align-self-start"
                                        style={{
                                            background: `${article.categoryColor}18`,
                                            color: article.categoryColor,
                                            fontSize: 11,
                                            letterSpacing: '0.06em',
                                        }}
                                    >
                                        {article.category}
                                    </span>

                                    <h3
                                        className="fw-bold text-start mb-0"
                                        style={{ fontSize: 16, color: '#191c1e', lineHeight: 1.4 }}
                                    >
                                        {article.title}
                                    </h3>

                                    <p
                                        className="text-start mb-0"
                                        style={{ fontSize: 13, color: '#737686', lineHeight: 1.6 }}
                                    >
                                        {article.excerpt}
                                    </p>

                                    <div
                                        className="d-flex align-items-center gap-1 mt-auto fw-semibold"
                                        style={{ fontSize: 13, color: '#2563EB' }}
                                    >
                                        Read More
                                        <span className="material-icons" style={{ fontSize: 16 }}>
                                            arrow_right_alt
                                        </span>
                                    </div>
                                </div>
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
