import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Spinner, Alert, Breadcrumb } from 'react-bootstrap';
import { ShieldCheck, Copy, User, MapPin, Store, CreditCard, ChevronRight, Check } from 'lucide-react';
import orderService from '../../services/orderService';

const OrderDetail = () => {
    const { orderCode } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await orderService.getOrderDetail(orderCode);

                const orderData = response?.data?.result || response?.result;
                if (orderData) {
                    setOrder(orderData);
                } else {
                    setError("Không tìm thấy thông tin đơn hàng này.");
                }
            } catch (err) {
                console.error("Lỗi khi lấy chi tiết đơn hàng:", err);
                setError("Không thể tải thông tin đơn hàng. Vui lòng thử lại sau!");
            } finally {
                setLoading(false);
            }
        };

        if (orderCode) {
            fetchOrderDetail();
        }
    }, [orderCode]);

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Định dạng tiền tệ VND
    const formatCurrency = (amount) => {
        if (typeof amount !== 'number') return '0đ';
        return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
    };

    // Định dạng ngày DD/MM/YYYY
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };

    // Định dạng thời gian ngắn hh:mm, DD/MM/YYYY để đưa vào dưới các Node Progress
    const formatTimeForTimeline = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}, ${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };

    // Định nghĩa màu sắc & nhãn trạng thái tổng quát
    const getStatusDetails = (status) => {
        switch (status) {
            case 'PENDING': return { text: 'Đang xử lý', color: 'text-warning', bg: '#fbfbfb' };
            case 'CONFIRMED': return { text: 'Đã xác nhận', color: 'text-primary', bg: '#fbfbfb' };
            case 'SHIPPING': return { text: 'Đang giao', color: 'text-info', bg: '#fbfbfb' };
            case 'DELIVERED': return { text: 'Đã giao thành công', color: 'text-success', bg: '#fbfbfb' };
            case 'CANCELLED': return { text: 'Đã hủy', color: 'text-danger', bg: '#fffdfd' };
            default: return { text: 'Trạng thái khác', color: 'text-secondary', bg: '#f8fafc' };
        }
    };

    // Hàm lấy tiêu đề text lớn bên trái hộp trạng thái
    const getStatusLeftBanner = (orderData) => {
        switch (orderData.status) {
            case 'PENDING':
                return { title: 'Chờ xử lý đơn hàng', desc: 'Nhà thuốc đang tiếp nhận và chuẩn bị sản phẩm cho bạn.' };
            case 'CONFIRMED':
                return { title: 'Đã xử lý đơn hàng', desc: 'Đơn hàng đã được xác nhận thành công và chuẩn bị đóng gói.' };
            case 'SHIPPING':
                return { title: 'Đang giao hàng', desc: 'Đơn hàng đang trên đường vận chuyển đến địa chỉ của bạn.' };
            case 'DELIVERED':
                return { title: 'Giao hàng thành công', desc: 'Rất vui vì bạn đã tin tưởng và mua hàng.' }; // Khớp chuẩn text thiết kế
            case 'CANCELLED':
                return { title: 'Đơn hàng đã hủy', desc: orderData.cancelReason || 'Hệ thống đã hủy đơn hàng thành công theo yêu cầu.' };
            default:
                return { title: 'Cập nhật đơn hàng', desc: 'Hệ thống đang tiến hành cập nhật dữ liệu.' };
        }
    };

    // Hàm bóc tách thời gian từ mảng statusHistory của Backend để điền vào chân Node tương ứng
    const getTimeFromHistory = (historyList, targetStatus) => {
        const historyItem = historyList?.find(h => h.status === targetStatus);
        return historyItem ? formatTimeForTimeline(historyItem.changedAt) : '';
    };

    // Định nghĩa danh sách các bước Progress chuẩn
    const steps = [
        { key: 'PENDING', label: 'Đặt hàng' },
        { key: 'CONFIRMED', label: 'Xử lý đơn' },
        { key: 'SHIPPING', label: 'Đang giao' },
        { key: 'DELIVERED', label: 'Nhận hàng' }
    ];

    // Hàm xác định xem Node đó đã hoàn thành hay chưa dựa vào vị trí hiện tại của status
    const getStepStatusIndex = (currentStatus) => {
        const statusOrder = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED'];
        return statusOrder.indexOf(currentStatus);
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" style={{ color: '#1250dc' }} />
                <p className="text-muted mt-2 small">Đang tải chi tiết đơn hàng #{orderCode}...</p>
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger" className="rounded-4 border-0 shadow-sm m-3">{error}</Alert>;
    }

    if (!order) return null;

    const statusInfo = getStatusDetails(order.status);
    const leftBanner = getStatusLeftBanner(order);
    const currentStepIndex = getStepStatusIndex(order.status);

    return (
        <div className="order-detail-container px-2 w-100 container">
            {/* Thanh Breadcrumb hướng dẫn đầu trang */}
            <Breadcrumb className="custom-breadcrumb small mb-3">
                <Breadcrumb.Item onClick={() => navigate('/')}>Trang chủ</Breadcrumb.Item>
                <Breadcrumb.Item onClick={() => navigate('/profile')}>Cá nhân</Breadcrumb.Item>
                <Breadcrumb.Item onClick={() => navigate('/profile?tab=orders')}>Đơn hàng của tôi</Breadcrumb.Item>
                <Breadcrumb.Item active>Chi tiết đơn hàng</Breadcrumb.Item>
            </Breadcrumb>

            <Row className="g-4">
                {/* CỘT BÊN TRÁI: CHI TIẾT ĐƠN HÀNG, ĐỊA CHỈ, DANH SÁCH SẢN PHẨM */}
                <Col lg={8}>


                    {/* 2. Khối Trạng thái chính của đơn hàng tích hợp Progress Tracking */}
                    <Card className="border-0 shadow-sm rounded-4 mb-3 overflow-hidden">
                        <Card.Header className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center flex-wrap gap-2 text-muted small">
                                <span className="fw-bold text-dark fs-6">Đơn hàng {formatDate(order.createdAt)}</span>
                                <span className="mx-1">•</span>
                                <span>Giao hàng tận nơi</span>
                                <span className="mx-1">•</span>
                                <span className="fw-medium text-secondary">#{order.orderCode}</span>
                                <span className="text-primary ms-1" style={{ cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => handleCopyCode(order.orderCode)}>
                                    <Copy size={13} className="me-1 d-inline" />{copied ? 'Đã chép' : 'Sao chép'}
                                </span>
                            </div>
                            <span className={`fw-bold small ${statusInfo.color}`}>
                                • {statusInfo.text}
                            </span>
                        </Card.Header>

                        <Card.Body className="px-4 py-4" style={{ backgroundColor: statusInfo.bg }}>
                            {order.status === 'CANCELLED' ? (
                                // Giao diện báo trạng thái HỦY ĐƠN HÀNG
                                <div className="text-start py-2">
                                    <h5 className="fw-bold text-danger mb-2" style={{ fontSize: '1.2rem' }}>{leftBanner.title}</h5>
                                    <p className="text-muted mb-0 small">{leftBanner.desc}</p>
                                </div>
                            ) : (
                                // Giao diện HOÀN THIỆN ĐẦY ĐỦ PROGRESS TRACKING THEO THIẾT KẾ
                                <Row className="align-items-center g-3">
                                    {/* Khối chữ bên trái */}
                                    <Col md={5} className="text-start">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <span className="p-1 rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center">
                                                <span className="bg-primary rounded-circle" style={{ width: '6px', height: '6px' }}></span>
                                            </span>
                                            <span className="text-muted small fw-medium">Dự kiến nhận hàng</span>
                                        </div>
                                        <h4 className="fw-bold text-dark mb-2" style={{ fontSize: '1.35rem', letterSpacing: '-0.3px' }}>
                                            {leftBanner.title}
                                        </h4>
                                        <p className="text-muted mb-0 small" style={{ lineHeight: '1.5' }}>{leftBanner.desc}</p>
                                    </Col>

                                    {/* Khối thanh tiến trình (Progress Bar) bên phải */}
                                    <Col md={7}>
                                        <div className="timeline-wrapper">
                                            <div className="timeline-container">
                                                {/* Thanh line nền chạy ngang */}
                                                <div className="timeline-progress-line">
                                                    <div
                                                        className="timeline-progress-fill"
                                                        style={{
                                                            width: `${currentStepIndex >= 0 ? (currentStepIndex / (steps.length - 1)) * 100 : 0}%`
                                                        }}
                                                    />
                                                </div>

                                                {/* Các Node trạng thái */}
                                                {steps.map((step, idx) => {
                                                    const isCompleted = idx <= currentStepIndex;
                                                    const stepTime = getTimeFromHistory(order.statusHistory, step.key);

                                                    return (
                                                        <div key={step.key} className="timeline-step-item">
                                                            <div className={`timeline-circle-node ${isCompleted ? 'active' : ''}`}>
                                                                {isCompleted && <Check size={12} strokeWidth={3} />}
                                                            </div>
                                                            <div className="timeline-step-label">{step.label}</div>
                                                            <div className="timeline-step-time">{stepTime || '--:--'}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            )}
                        </Card.Body>
                    </Card>

                    {/* 3. Khối 3 cột thông tin: Người nhận, Địa chỉ, Nhà thuốc chịu trách nhiệm */}
                    <Card className="border-0 shadow-sm rounded-4 mb-3 overflow-hidden">
                        <Card.Body className="p-0">
                            <Row className="g-0 divide-cols">
                                <Col md={4} className="p-4 border-end text-start">
                                    <div className="d-flex align-items-center gap-2 mb-3 text-primary fw-bold small">
                                        <User size={16} /> <span>Thông tin người nhận</span>
                                    </div>
                                    <p className="mb-1 fw-bold text-dark small">{order.shippingFullName || 'Người nhận'}</p>
                                    <p className="mb-0 text-muted small">{order.shippingPhone}</p>
                                </Col>

                                <Col md={4} className="p-4 border-end text-start">
                                    <div className="d-flex align-items-center gap-2 mb-3 text-primary fw-bold small">
                                        <MapPin size={16} /> <span>Nhận hàng tại</span>
                                    </div>
                                    <p className="mb-0 text-dark small text-wrap style-address">
                                        {order.shippingFullAddress}
                                    </p>
                                </Col>

                                <Col md={4} className="p-4 text-start">
                                    <div className="d-flex align-items-center gap-2 mb-3 text-primary fw-bold small">
                                        <Store size={16} /> <span>Nhà thuốc xử lý đơn</span>
                                    </div>
                                    <p className="mb-1 fw-bold text-dark small">Nhà thuốc Quốc Thái</p>
                                    <p className="mb-0 text-muted small">Hẻm 116 Đường 17, Linh Trung, Thủ Đức, TP. Hồ Chí Minh</p>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* 4. Khối danh sách sản phẩm thực tế */}
                    <p className="px-1 mb-2 text-start fw-medium text-secondary small">Danh sách sản phẩm</p>
                    <Card className="border-0 shadow-sm rounded-4 mb-4">
                        <Card.Body className="px-4 py-2">
                            {order.items?.map((item, index) => (
                                <div key={item.id || index} className="d-flex align-items-center justify-content-between py-3 border-bottom border-light last-row-none">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="border rounded-3 p-1 bg-white d-flex align-items-center justify-content-center" style={{ width: '68px', height: '68px', minWidth: '68px' }}>
                                            <img
                                                src={item.imageUrl}
                                                alt={item.productName}
                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                onError={(e) => { e.target.src = "https://placehold.co/70x70?text=DuocPham"; }}
                                            />
                                        </div>
                                        <div className="text-start">
                                            <p className="mb-1 fw-medium text-dark small text-wrap text-break" style={{ maxWidth: '440px', lineHeight: '1.4' }}>
                                                {item.productName}
                                            </p>
                                            <span className="text-primary small fw-medium" style={{ cursor: 'pointer', fontSize: '0.8rem' }}
                                                onClick={() => navigate(`/products/detail/${item.productSlug}`)}>
                                                Xem chi tiết sản phẩm <ChevronRight size={12} className="d-inline" />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <span className="fw-bold text-dark d-block small">{formatCurrency(item.priceAtTime)}</span>
                                        <span className="text-muted small" style={{ fontSize: '0.8rem' }}>x{item.quantity} {item.variantName || 'Hộp'}</span>
                                    </div>
                                </div>
                            ))}
                        </Card.Body>
                    </Card>
                </Col>

                {/* CỘT BÊN PHẢI: CHI TIẾT TÍNH TIỀN HÓA ĐƠN RĂNG CƯA */}
                <Col lg={4}>
                    <div className="receipt-box bg-white shadow-sm rounded-4 overflow-hidden mb-4">
                        <div className="p-4 pb-3">
                            <h6 className="fw-bold text-dark mb-4 text-start">Thông tin thanh toán</h6>

                            <div className="d-flex justify-content-between mb-2 small">
                                <span className="text-muted">Tổng tiền</span>
                                <span className="text-dark fw-medium">{formatCurrency(order.totalAmount)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 small">
                                <span className="text-muted">Giảm giá trực tiếp</span>
                                <span className="text-warning fw-medium">0đ</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 small">
                                <span className="text-muted">Giảm giá voucher</span>
                                <span className="text-warning fw-medium">0đ</span>
                            </div>
                            <div className="d-flex justify-content-between mb-3 small">
                                <span className="text-muted">Phí vận chuyển</span>
                                <span className="text-dark fw-medium">{formatCurrency(order.shippingFee)}</span>
                            </div>

                            <hr className="border-light my-3" />

                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <span className="fw-bold text-dark small">Thành tiền</span>
                                <span className="fw-bold text-primary fs-4">{formatCurrency(order.finalAmount)}</span>
                            </div>

                            <div className="payment-method-section pt-2 border-top border-light">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="small text-muted fw-bold">Phương thức thanh toán</span>
                                    <span className={`badge rounded-pill px-2 py-1 ${order.paymentStatus === 'PAID' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`} style={{ fontSize: '0.7rem' }}>
                                        • {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                    </span>
                                </div>
                                <div className="d-flex align-items-center gap-2 p-2 rounded-3 bg-light mt-1 text-start">
                                    <div className="bg-white p-1 rounded-2 border d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                        <CreditCard size={18} className="text-primary" />
                                    </div>
                                    <div className="lh-sm">
                                        <p className="mb-0 fw-medium text-dark" style={{ fontSize: '0.8rem' }}>
                                            {order.paymentMethod === 'COD' ? 'Thanh toán tiền mặt khi nhận hàng (COD)' : 'Thanh toán bằng chuyển khoản'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ĐÁY RĂNG CƯA ĐỘC QUYỀN VÀ NÚT MUA LẠI */}
                        <div className="receipt-sawtooth-edge"></div>

                        <div className="p-4 pt-2 bg-white">
                            <Button
                                variant="primary"
                                className="w-100 rounded-pill py-2 fw-bold shadow-sm mt-2"
                                style={{ backgroundColor: '#1250dc', border: 'none' }}
                            >
                                Mua lại
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Toàn bộ khối CSS Custom bổ sung hệ thống Progress Stepper */}
            <style>{`
                .custom-breadcrumb .breadcrumb-item + .breadcrumb-item::before {
                    content: "/";
                    color: #adb5bd;
                }
                .custom-breadcrumb a {
                    text-decoration: none;
                    color: #1250dc;
                    font-weight: 500;
                }
                .custom-breadcrumb .breadcrumb-item.active {
                    color: #6c757d;
                }
                .divide-cols > div {
                    position: relative;
                }
                .style-address {
                    line-height: 1.5;
                    font-size: 0.85rem !important;
                }
                .last-row-none:last-child {
                    border-bottom: none !important;
                }
                .receipt-box {
                    position: relative;
                    border-bottom-left-radius: 0px !important;
                    border-bottom-right-radius: 0px !important;
                }
                .receipt-sawtooth-edge {
                    width: 100%;
                    height: 14px;
                    background-image: linear-gradient(-45deg, #fff 7px, transparent 0), linear-gradient(45deg, #fff 7px, transparent 0);
                    background-position: left bottom;
                    background-size: 14px 14px;
                    background-repeat: repeat-x;
                    filter: drop-shadow(0px 4px 2px rgba(0,0,0,0.03));
                    position: relative;
                    z-index: 10;
                    margin-top: -5px;
                    background-color: #f8fafc;
                }

                /* ==================== CSS TIMELINE PROGRESS STEPPER DỰA TRÊN ẢNH GIAO DIỆN ==================== */
                .timeline-wrapper {
                    padding: 10px 5px 5px 5px;
                }
                .timeline-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: relative;
                    width: 100%;
                }
                .timeline-progress-line {
                    position: absolute;
                    top: 15px;
                    left: 5%;
                    right: 5%;
                    height: 4px;
                    background-color: #e2e8f0;
                    z-index: 1;
                    transform: translateY(-50%);
                }
                .timeline-progress-fill {
                    height: 100%;
                    background-color: #22c55e; /* Màu xanh lá cây chuẩn thiết kế */
                    transition: width 0.4s ease;
                }
                .timeline-step-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                    z-index: 2;
                    width: 25%;
                }
                .timeline-circle-node {
                    width: 26px;
                    height: 26px;
                    border-radius: 50%;
                    background-color: #e2e8f0;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid #fff;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                }
                .timeline-circle-node.active {
                    background-color: #22c55e; /* Trạng thái kích hoạt thành công */
                    border-color: #fff;
                }
                .timeline-step-label {
                    margin-top: 8px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: #334155;
                    white-space: nowrap;
                }
                .timeline-step-time {
                    margin-top: 2px;
                    font-size: 0.7rem;
                    color: #64748b;
                    white-space: nowrap;
                    font-weight: 400;
                }

                @media (max-width: 767.98px) {
                    .divide-cols > div {
                        border-end: none !important;
                        border-bottom: 1px solid #f1f5f9;
                    }
                    .divide-cols > div:last-child {
                        border-bottom: none;
                    }
                    .timeline-step-label, .timeline-step-time {
                        font-size: 0.65rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default OrderDetail;