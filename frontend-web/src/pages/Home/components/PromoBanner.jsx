import { Link } from 'react-router-dom';

/**
 * PromoBanner — Banner khuyến mãi "Giảm đến 50% Thực Phẩm Chức Năng"
 * Gradient xanh lá → xanh dương, ảnh sản phẩm bên phải.
 * TODO: thay src ảnh bằng import thật khi có file
 */
export default function PromoBanner() {
    return (
        <section className="py-5" style={{ background: '#fff' }}>
            <div className="container-xl">
                <div
                    className="position-relative overflow-hidden rounded-4 px-4 px-md-5 py-5 d-flex align-items-center"
                    style={{
                        background: 'linear-gradient(135deg, #007D55 0%, #2563EB 100%)',
                        minHeight: 240,
                    }}
                >
                    {/* Decorative circles */}
                    <div
                        className="position-absolute rounded-circle"
                        style={{
                            width: 300,
                            height: 300,
                            background: 'rgba(255,255,255,0.06)',
                            top: -80,
                            right: 200,
                        }}
                    />
                    <div
                        className="position-absolute rounded-circle"
                        style={{
                            width: 200,
                            height: 200,
                            background: 'rgba(255,255,255,0.04)',
                            bottom: -60,
                            right: 100,
                        }}
                    />

                    {/* Content */}
                    <div className="position-relative" style={{ zIndex: 2, maxWidth: 480 }}>
                        <span
                            className="badge rounded-pill px-3 py-2 mb-3 fw-semibold"
                            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12 }}
                        >
                            Ưu đãi độc quyền App
                        </span>
                        <h2
                            className="fw-bold text-white text-start mb-2"
                            style={{
                                fontFamily: 'Manrope, system-ui, sans-serif',
                                fontSize: 'clamp(22px, 3vw, 34px)',
                                lineHeight: 1.15,
                            }}
                        >
                            Giảm Đến 50% Toàn Bộ<br />Thực Phẩm Chức Năng
                        </h2>
                        <p
                            className="text-start mb-4"
                            style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 1.6 }}
                        >
                            Chăm sóc sức khỏe mỗi ngày không lo về giá.<br />
                            Ưu đãi kéo dài đến hết 31/12.
                        </p>
                        <Link
                            to="/products"
                            className="btn rounded-pill px-5 py-2 fw-bold text-primary"
                            style={{
                                background: '#fff',
                                fontSize: 15,
                                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                            }}
                        >
                            Shop Now
                        </Link>
                    </div>

                    {/* Promo image */}
                    <img
                        src="/images/promo/supplement-promo.png"
                        alt="Thực phẩm chức năng khuyến mãi"
                        className="position-absolute d-none d-md-block"
                        style={{
                            right: 48,
                            bottom: 0,
                            height: '110%',
                            objectFit: 'contain',
                            maxWidth: 300,
                        }}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                </div>
            </div>
        </section>
    );
}
