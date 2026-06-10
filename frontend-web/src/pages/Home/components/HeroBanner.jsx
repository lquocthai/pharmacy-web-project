import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Import các ảnh banner chính (Slider bên trái)
import Banner1 from '../../../assets/20260601032613-0-imagebannergiadinhvui.png';
import Banner2 from '../../../assets/20260528074041-0-imagebanmoi.png';
import Banner3 from '../../../assets/20260601021208-0-bannerimagebuymore.png';

import Banner4 from '../../../assets/banner-mienphivanchuyen.png';
import Banner5 from '../../../assets/Banner_H2_1_6d86dbb69f.webp';

// Import các icon tính năng chuẩn xác
import SearchIcon from '../../../assets/tracuu.webp';
import AdvidseIcon from '../../../assets/tuvanvoiduocsi_1855320b40.webp';
import PrescriptionIcon from '../../../assets/donthuoc.webp';
import OrderIcon from '../../../assets/48px_fe435f0cad.webp';

const SLIDES = [
    {
        id: 1,
        image: Banner1,
        badge: 'Giao hàng 2 giờ',
        headline: 'Nhà Thuốc Trực Tuyến\nUy Tín Cho Mọi Gia Đình',
        sub: 'Chăm sóc sức khỏe toàn diện với đội ngũ dược sĩ chuyên nghiệp 24/7.\nThuốc chính hãng giao tận nơi chỉ trong 2 giờ.',
        cta: { label: 'Mua Thuốc Ngay', to: '/products' },
        ctaSecondary: { label: 'Tư Vấn Dược Sĩ', to: '/chat' },
        accentColor: '#2563EB',
    },
    {
        id: 2,
        image: Banner2,
        badge: 'Ưu đãi độc quyền',
        headline: 'Giảm Đến 50%\nThực Phẩm Chức Năng',
        sub: 'Chăm sóc sức khỏe mỗi ngày không lo về giá.\nƯu đãi kéo dài đến hết 31/12.',
        cta: { label: 'Khám Phá Ngay', to: '/products' },
        ctaSecondary: null,
        accentColor: '#007D55',
    },
    {
        id: 3,
        image: Banner3,
        badge: 'Dược sĩ 24/7',
        headline: 'Tư Vấn Sức Khỏe\nMiễn Phí Mọi Lúc',
        sub: 'Đội ngũ dược sĩ chuyên nghiệp luôn sẵn sàng\nhỗ trợ bạn hoàn toàn miễn phí.',
        cta: { label: 'Chat Với Dược Sĩ', to: '/chat' },
        ctaSecondary: null,
        accentColor: '#2563EB',
    },
];

// SỬA LỖI 1 & 2: Loại bỏ cặp ngoặc nhọn ở icon để truyền String, sửa lại ID không trùng nhau
const CATEGORIES = [
    { id: 1, label: 'Dược sĩ tư vấn', icon: AdvidseIcon, to: '/chat' },
    { id: 2, label: 'Đơn thuốc', icon: PrescriptionIcon, to: '/prescription' },
    { id: 3, label: 'Đơn của tôi', icon: OrderIcon, to: '/orders' },
    { id: 4, label: 'Tìm kiếm nhanh chóng', icon: SearchIcon, to: '/search' },
];

const AUTOPLAY_DELAY = 5000;

export default function HeroBanner() {
    const [current, setCurrent] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const goNext = useCallback(() => {
        setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, []);

    const goPrev = useCallback(() => {
        setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    }, []);

    useEffect(() => {
        if (isPaused) return;
        const timer = setInterval(goNext, AUTOPLAY_DELAY);
        return () => clearInterval(timer);
    }, [goNext, isPaused]);

    return (
        <div className="container-xl py-3">
            {/* PHẦN 1: BANNER GRID (Slider trái + 2 Banner phải) */}
            <div className="row g-3">
                {/* Khối Slider bên trái */}
                <div className="col-12 col-lg-8">
                    <section
                        className="position-relative overflow-hidden rounded-4 w-100 h-100"
                        style={{ minHeight: 320, height: '400px', background: '#EFF4FF' }}
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                    >
                        {/* Slide track */}
                        {SLIDES.map((s, idx) => (
                            <div
                                key={s.id}
                                className="position-absolute w-100 h-100 top-0 start-0 d-flex align-items-center"
                                style={{
                                    opacity: idx === current ? 1 : 0,
                                    transition: 'opacity 0.7s ease',
                                    pointerEvents: idx === current ? 'auto' : 'none',
                                    zIndex: idx === current ? 1 : 0,
                                }}
                            >
                                <img
                                    src={s.image}
                                    alt={s.headline}
                                    className="position-absolute w-100 h-100 top-0 start-0"
                                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                                    loading={idx === 0 ? 'eager' : 'lazy'}
                                />

                                <div className="position-relative p-4 p-md-5 w-100" style={{ zIndex: 3, height: '100%' }}>
                                    <div className="d-flex flex-column justify-content-center h-100" style={{ maxWidth: '450px' }}>
                                        {/* <span className="badge rounded-pill px-3 py-2 mb-2 d-inline-block align-self-start" style={{ background: `${s.accentColor}18`, color: s.accentColor }}>
                                            {s.badge}
                                        </span>
                                        <h1 className="fw-bold mb-2 text-dark fs-3 text-start" style={{ whiteSpace: 'pre-line' }}>{s.headline}</h1>
                                        <p className="text-muted small mb-3 text-start d-none d-sm-block" style={{ whiteSpace: 'pre-line' }}>{s.sub}</p>
                                        <div className="d-flex gap-2">
                                            <Link to={s.cta.to} className="btn btn-sm rounded-pill text-white px-3" style={{ background: s.accentColor }}>
                                                {s.cta.label}
                                            </Link>
                                        </div> */}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Nút điều hướng mũi tên */}
                        <button onClick={goPrev} className="position-absolute top-50 translate-middle-y btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center p-0 ms-3" style={{ left: 0, width: 36, height: 36, zIndex: 10, border: 'none' }}>
                            <FaChevronLeft size={12} color="#434655" />
                        </button>
                        <button onClick={goNext} className="position-absolute top-50 translate-middle-y btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center p-0 me-3" style={{ right: 0, width: 36, height: 36, zIndex: 10, border: 'none' }}>
                            <FaChevronRight size={12} color="#434655" />
                        </button>

                        {/* Các dấu chấm chuyển slide */}
                        <div className="position-absolute bottom-0 start-50 translate-middle-x d-flex gap-2 pb-3" style={{ zIndex: 10 }}>
                            {SLIDES.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrent(idx)}
                                    className="border-0 p-0 rounded-pill"
                                    style={{
                                        width: idx === current ? 20 : 7,
                                        height: 7,
                                        background: idx === current ? '#2563EB' : '#C3C6D7',
                                        transition: 'all 0.3s ease',
                                    }}
                                />
                            ))}
                        </div>
                    </section>
                </div>

                {/* Khối 2 ảnh nhỏ bên phải */}
                <div className="col-12 col-lg-4 d-flex flex-column gap-3">
                    <div className="flex-fill position-relative overflow-hidden rounded-4" style={{ height: '192px' }}>
                        <img
                            src={Banner4}
                            alt="Banner Phụ Trên"
                            className="w-100 h-100"
                            style={{ objectFit: 'cover', cursor: 'pointer' }}
                        />
                    </div>
                    <div className="flex-fill position-relative overflow-hidden rounded-4" style={{ height: '192px' }}>
                        <img
                            src={Banner5}
                            alt="Banner Phụ Dưới"
                            className="w-100 h-100"
                            style={{ objectFit: 'cover', cursor: 'pointer' }}
                        />
                    </div>
                </div>
            </div>

            {/* PHẦN 2: THANH DANH MỤC TÍNH NĂNG */}
            {/* PHẦN 2: THANH DANH MỤC TÍNH NĂNG (Tách riêng biệt từng cục) */}
            <div className="row row-cols-2 row-cols-md-4 g-3 mt-4 mx-0">
                {CATEGORIES.map((cat) => (
                    <div key={cat.id} className="col">
                        <Link
                            to={cat.to}
                            className="text-decoration-none d-flex flex-column align-items-center justify-content-center p-3 h-100 text-center bg-white border rounded-4 shadow-sm feature-item"
                            style={{
                                color: '#434655',
                                transition: 'all 0.2s ease-in-out',
                            }}
                        >
                            {/* Khối chứa ảnh Icon tròn/gọn gàng */}
                            <div
                                className="mb-2 d-flex align-items-center justify-content-center bg-light rounded-circle"
                                style={{ width: '56px', height: '56px', padding: '8px' }}
                            >
                                <img
                                    src={cat.icon}
                                    alt={cat.label}
                                    className="img-fluid"
                                    style={{ objectFit: 'contain' }}
                                />
                            </div>

                            {/* Chữ hiển thị */}
                            <span className="small fw-semibold text-dark mt-1">{cat.label}</span>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}