/**
 * HowItWorks — "Quy Trình Mua Thuốc Đơn Giản" — 4 bước
 */

const STEPS = [
    {
        icon: 'search',
        step: '1',
        title: 'Search',
        desc: 'Tìm sản phẩm hoặc gửi toa thuốc của bạn',
        color: '#2563EB',
        bg: '#EFF4FF',
    },
    {
        icon: 'add_shopping_cart',
        step: '2',
        title: 'Add to Cart',
        desc: 'Chọn số lượng và thêm vào giỏ hàng',
        color: '#007D55',
        bg: '#F0FDF4',
    },
    {
        icon: 'payments',
        step: '3',
        title: 'Pay',
        desc: 'Thanh toán an toàn đa phương thức',
        color: '#B45309',
        bg: '#FFFBEB',
    },
    {
        icon: 'local_shipping',
        step: '4',
        title: 'Delivery',
        desc: 'Nhận hàng tại nhà chỉ trong 2 giờ',
        color: '#6D28D9',
        bg: '#F5F3FF',
    },
];

export default function HowItWorks() {
    return (
        <div className="container-xl py-3 ">
            <section className="py-5 rounded-4" style={{ background: '#f7f9fb' }}>
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
                            Quy Trình Mua Thuốc Đơn Giản
                        </h2>
                        <div
                            className="mx-auto"
                            style={{ width: 48, height: 3, background: '#2563EB', borderRadius: 2 }}
                        />
                    </div>

                    {/* Steps */}
                    <div className="row g-4 align-items-start justify-content-center">
                        {STEPS.map((step, idx) => (
                            <div key={step.step} className="col-6 col-md-3">
                                <div className="d-flex flex-column align-items-center text-center gap-3">
                                    {/* Icon with connector */}
                                    <div className="position-relative">
                                        <div
                                            className="d-flex align-items-center justify-content-center rounded-circle"
                                            style={{
                                                width: 72,
                                                height: 72,
                                                background: step.bg,
                                                border: `2px solid ${step.color}22`,
                                            }}
                                        >
                                            <span
                                                className="material-icons"
                                                style={{ fontSize: 32, color: step.color }}
                                            >
                                                {step.icon}
                                            </span>
                                        </div>

                                        {/* Step number badge */}
                                        <span
                                            className="position-absolute d-flex align-items-center justify-content-center rounded-circle fw-bold text-white"
                                            style={{
                                                width: 22,
                                                height: 22,
                                                background: step.color,
                                                fontSize: 11,
                                                bottom: 0,
                                                right: 0,
                                                border: '2px solid #f7f9fb',
                                            }}
                                        >
                                            {step.step}
                                        </span>
                                    </div>

                                    <div>
                                        <div
                                            className="fw-bold mb-1"
                                            style={{ fontSize: 15, color: '#191c1e' }}
                                        >
                                            {step.title}
                                        </div>
                                        <div style={{ fontSize: 13, color: '#737686', lineHeight: 1.5 }}>
                                            {step.desc}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
