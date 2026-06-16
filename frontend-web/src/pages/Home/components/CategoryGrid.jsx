import { useNavigate } from 'react-router-dom';

/**
 * CategoryGrid — Danh mục nổi bật
 * Nhận categories từ HomePage (đã fetch), hiển thị dạng grid icon.
 * Icon: dùng Material Icons (đã có trong HTML gốc) hoặc react-icons làm fallback.
 */

// Mapping slug → Material Icon name (fallback nếu API không trả icon)
const ICON_MAP = {
    'thuoc-ke-don': 'medical_services',
    'thuoc-khong-ke-don': 'pill',
    'thuc-pham-chuc-nang': 'nutrition',
    'vitamin-khoang-chat': 'nutrition',
    'cham-soc-ca-nhan': 'face',
    'thiet-bi-y-te': 'monitor_heart',
    'me-va-be': 'child_care',
    'nguoi-cao-tuoi': 'elderly',
    'duoc-my-pham': 'spa',
    'supplements': 'fitness_center',
};

// Màu background icon theo thứ tự (cycle)
const BG_COLORS = [
    '#EFF4FF', '#F0FDF4', '#FFF7ED', '#FDF4FF',
    '#ECFEFF', '#FFF1F2', '#F0F9FF', '#FAFAF9',
];

export default function CategoryGrid({ categories = [], loading = false }) {
    const navigate = useNavigate();

    const skeletons = Array.from({ length: 8 });

    if (loading) {
        return (
            <div className="container-xl py-3 ">
                <section className=" rounded-4" style={{ background: '#fff' }}>
                    <div className="container-xl">
                        <div className="text-center mb-4">
                            <div className="skeleton-line mx-auto" style={{ width: 200, height: 28, borderRadius: 8 }} />
                        </div>
                        <div className="row g-3 justify-content-center">
                            {skeletons.map((_, i) => (
                                <div key={i} className="col-6 col-sm-4 col-md-3 col-lg-2">
                                    <div className="d-flex flex-column align-items-center gap-2 p-3">
                                        <div className="skeleton-line rounded-circle" style={{ width: 60, height: 60 }} />
                                        <div className="skeleton-line" style={{ width: 80, height: 14, borderRadius: 6 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="container-xl py-3 ">
            <section className="py-5 pt-3 rounded-4" style={{ background: '#fff' }}>
                <div className="container-xl">
                    {/* Section header */}
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <div>
                            <h2
                                className="fw-bold mb-1 text-start"
                                style={{
                                    fontFamily: 'Manrope, system-ui, sans-serif',
                                    fontSize: 24,
                                    color: '#191c1e',
                                }}
                            >
                                Danh Mục Nổi Bật
                            </h2>
                            <div style={{ width: 48, height: 3, background: '#2563EB', borderRadius: 2 }} />
                        </div>
                    </div>

                    <div className="row g-3 justify-content-start">
                        {categories.map((cat, idx) => {
                            // const iconName = ICON_MAP[cat.slug] || 'category';
                            const bgColor = BG_COLORS[idx % BG_COLORS.length];

                            return (
                                <div
                                    key={cat.id}
                                    className="col-6 col-sm-4 col-md-3 col-lg-2"
                                >
                                    <button
                                        onClick={() => navigate(`/products/${cat.slug}`)}
                                        className="w-100 border-0 bg-transparent p-0"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div
                                            className="d-flex flex-column align-items-center gap-2 p-3 rounded-3 h-100"
                                            style={{
                                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                                background: '#f7f9fb',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            {/* Icon circle */}
                                            <div
                                                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                                style={{
                                                    width: 60,
                                                    height: 60,
                                                    background: bgColor,
                                                }}
                                            >
                                                <span
                                                    className="material-icons"
                                                    style={{ fontSize: 28, color: '#2563EB' }}
                                                >
                                                    <img
                                                        src={cat.icon || 'null'}

                                                    />
                                                </span>
                                            </div>

                                            {/* Name */}
                                            <span
                                                className="fw-semibold text-center"
                                                style={{
                                                    fontSize: 13,
                                                    color: '#191c1e',
                                                    lineHeight: 1.3,
                                                }}
                                            >
                                                {cat.name}
                                            </span>
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>

    );
}
