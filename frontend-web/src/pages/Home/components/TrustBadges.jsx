/**
 * TrustBadges — 4 USP badges bên dưới category grid
 * "Giao hàng 2h / 24/7 Pharmacist / Cam kết chính hãng / Đổi trả 30 ngày"
 */

const BADGES = [
    {
        icon: 'schedule',
        color: '#2563EB',
        bg: '#EFF4FF',
        title: '2h Delivery',
        desc: 'Giao nhanh trong nội thành',
    },
    {
        icon: 'support_agent',
        color: '#007D55',
        bg: '#F0FDF4',
        title: '24/7 Pharmacist',
        desc: 'Tư vấn miễn phí mọi lúc',
    },
    {
        icon: 'verified',
        color: '#B45309',
        bg: '#FFFBEB',
        title: 'Genuine Commitment',
        desc: 'Cam kết 100% chính hãng',
    },
    {
        icon: 'replay',
        color: '#6D28D9',
        bg: '#F5F3FF',
        title: 'Easy Returns',
        desc: 'Đổi trả trong 30 ngày',
    },
];

export default function TrustBadges() {
    return (
        <section
            className="py-4"
            style={{ background: '#f7f9fb', borderTop: '1px solid #eceef0', borderBottom: '1px solid #eceef0' }}
        >
            <div className="container-xl">
                <div className="row g-3">
                    {BADGES.map((badge) => (
                        <div key={badge.title} className="col-6 col-md-3">
                            <div
                                className="d-flex align-items-center gap-3 p-3 rounded-3 h-100"
                                style={{ background: '#fff', boxShadow: '0 1px 4px rgba(37,99,235,0.06)' }}
                            >
                                <div
                                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                    style={{ width: 48, height: 48, background: badge.bg }}
                                >
                                    <span
                                        className="material-icons"
                                        style={{ fontSize: 24, color: badge.color }}
                                    >
                                        {badge.icon}
                                    </span>
                                </div>
                                <div className="text-start">
                                    <div
                                        className="fw-bold"
                                        style={{ fontSize: 14, color: '#191c1e' }}
                                    >
                                        {badge.title}
                                    </div>
                                    <div
                                        style={{ fontSize: 12, color: '#737686', lineHeight: 1.4 }}
                                    >
                                        {badge.desc}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
