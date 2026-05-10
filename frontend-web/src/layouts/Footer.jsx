import { Link } from 'react-router-dom'
import {
    FaMapMarkerAlt, FaPhoneAlt,
    FaFacebookF, FaMobileAlt, FaQrcode, FaCreditCard
} from 'react-icons/fa'
import { SiZalo } from 'react-icons/si'
import '../assets/styles/Footer.scss'

const FOOTER_LINKS = {
    'VỀ CHÚNG TÔI': [
        'Giới thiệu', 'Hệ thống cửa hàng', 'Giấy phép kinh doanh',
        'Quy chế hoạt động', 'Chính sách đặt cọc', 'Chính sách nội dung',
        'Chính sách đổi trả thuốc', 'Chính sách giao hàng', 'Chính sách bảo mật',
        'Chính sách thanh toán', 'Kiểm tra hóa đơn điện tử',
        'Chính sách bảo mật dữ liệu cá nhân',
    ],
    'DANH MỤC': [
        'Thực phẩm chức năng', 'Dược mỹ phẩm', 'Thuốc',
        'Chăm sóc cá nhân', 'Trang thiết bị y tế',
        'Đặt thuốc online'
    ],
    'TÌM HIỂU THÊM': [
        'Góc sức khỏe', 'Tra cứu thuốc', 'Tra cứu dược chất',
        'Tra cứu dược liệu', 'Bệnh thường gặp', 'Bệnh viện',
        'Đội ngũ chuyên môn', 'Tin tức tuyển dụng', 'Tin tức sự kiện',
    ],
}

const HOTLINES = [
    { label: 'Tư vấn mua hàng', branch: 'Nhánh 1' },
    { label: 'Trung tâm Vắc xin', branch: 'Nhánh 2' },
    { label: 'Góp ý, khiếu nại', branch: 'Nhánh 3' },
]

const PAYMENTS = ['VISA', 'Mastercard', 'JCB', 'Amex', 'Napas', 'Momo', 'ZaloPay', 'VNPay', 'Apple Pay']

export default function Footer() {
    return (
        <footer>
            {/* ── Banner ── */}
            <div className="footer-banner py-3">
                <div className="container-xl d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <span className="d-flex align-items-center gap-2 text-white fw-semibold fs-5">
                        <FaMapMarkerAlt />
                        Xem hệ thống 2478 nhà thuốc trên toàn quốc
                    </span>
                    <Link to="#" className="btn rounded-pill btn-outline-light btn-sm px-4 py-2 fw-medium">
                        Xem danh sách nhà thuốc
                    </Link>
                </div>
            </div>

            {/* ── Main ── */}
            <div className="footer-main py-4">
                <div className="container-xl">
                    <div className="row g-4 justify-content-center">

                        {/* Link columns */}
                        {Object.entries(FOOTER_LINKS).map(([title, links]) => (
                            <div key={title} className="col-6 col-md-3 col-lg-2">
                                <h6 className="footer-col-title">{title}</h6>
                                <ul className="list-unstyled mb-0 d-flex flex-column gap-1">
                                    {links.map(link => (
                                        <li key={link}>
                                            <Link to="#" className="footer-link small">{link}</Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}

                        {/* Hotline */}
                        <div className="col-6 col-md-3 col-lg-2">
                            <h6 className="footer-col-title">TỔNG ĐÀI (8:00–22:00)</h6>
                            <div className="d-flex flex-column gap-2">
                                {HOTLINES.map(h => (
                                    <div key={h.branch}>
                                        <p className="text-muted mb-0" style={{ fontSize: 12 }}>{h.label}</p>
                                        <a href="tel:18006928" className="footer-hotline d-inline-flex align-items-center gap-1">
                                            <FaPhoneAlt size={10} /> 18006928
                                        </a>
                                        <span className="text-muted ms-1" style={{ fontSize: 11 }}>({h.branch})</span>
                                    </div>
                                ))}
                            </div>

                            <h6 className="footer-col-title mt-3">CHỨNG NHẬN BỞI</h6>
                            <div className="d-flex gap-2">
                                <span className="cert-badge bg-danger">DMCA</span>
                                <span className="cert-badge" style={{ background: '#1d4ed8' }}>BCT</span>
                                <span className="cert-badge bg-dark">✓</span>
                            </div>
                        </div>

                        {/* Social + QR + Payment */}
                        <div className="col-12 col-md-6 col-lg-2">
                            <h6 className="footer-col-title">KẾT NỐI VỚI CHÚNG TÔI</h6>
                            <div className="d-flex gap-2 mb-3">
                                <a href="#" className="social-btn social-btn--fb" aria-label="Facebook"><FaFacebookF /></a>
                                <a href="#" className="social-btn social-btn--zalo" aria-label="Zalo"><SiZalo /></a>
                            </div>

                            <h6 className="footer-col-title">
                                <FaMobileAlt className="me-1" /> TẢI ỨNG DỤNG
                            </h6>
                            <div className="qr-box mb-1 d-flex align-items-center justify-content-center">
                                <FaQrcode size={64} color="#1250dc" />
                            </div>
                            <p className="text-muted mb-3" style={{ fontSize: 11 }}>Quét mã để tải app</p>

                            <h6 className="footer-col-title">
                                <FaCreditCard className="me-1" /> HỖ TRỢ THANH TOÁN
                            </h6>
                            <div className="d-flex flex-wrap gap-1">
                                {PAYMENTS.map(m => (
                                    <span key={m} className="payment-badge">{m}</span>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* ── Bottom ── */}
            <div className="footer-bottom py-2">
                <div className="container-xl text-center">
                    <p className="text-muted mb-0" style={{ fontSize: 12 }}>
                        © 2024 Công ty Cổ phần Dược phẩm Quốc Thái.
                    </p>
                </div>
            </div>
        </footer>
    )
}
