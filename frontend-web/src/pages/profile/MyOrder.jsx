import React, { useState, useEffect } from 'react';
import { Card, Button, Form, InputGroup, Nav, Spinner, Alert, Modal } from 'react-bootstrap';
import { Search } from 'lucide-react';
import './MyOrder.scss'; // File CSS riêng cho MyOrders để tùy chỉnh giao diện
import orderService from '../../services/orderService';
import { useNavigate } from 'react-router-dom';
import orderEmpty from '../../assets/order-not-found.svg';
import toast from 'react-hot-toast'; // Sử dụng react-hot-toast đồng bộ dự án
import { setCart } from '../../redux/slices/cartSlice'; // Import action cập nhật giỏ hàng
import { useDispatch } from 'react-redux'; // Import dispatch
import cartService from '../../services/cartService'; // Thêm cartService để xử lý mua lại
import ReBuyModal from './ReBuyModal';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('ALL'); // Trạng thái tab hiện tại
    const [searchTerm, setSearchTerm] = useState(''); // Từ khóa tìm kiếm công khai
    const [debouncedSearch, setDebouncedSearch] = useState(''); // Từ khóa đã delay để giảm tần suất trigger
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // --- STATE QUẢN LÝ MODAL MUA LẠI ---
    const [showReorderModal, setShowReorderModal] = useState(false);
    const [selectedOrderItems, setSelectedOrderItems] = useState([]);
    // 1. Cơ chế Debounce cho ô tìm kiếm để tránh việc re-render liên tục khi gõ chữ
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 400); // Đợi user dừng gõ 400ms mới xử lý
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // 2. Gọi API thực tế lấy danh sách mỗi khi chuyển đổi Tab trạng thái
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError(null);
                const statusParam = activeTab !== 'ALL' ? activeTab : undefined;
                console.log("Gọi API lấy đơn hàng với status:", statusParam);
                const response = await orderService.getMyOrders(statusParam);

                const orderData = response?.data?.result || response?.result || [];
                console.log("Dữ liệu đơn hàng nhận được từ API:", orderData);
                setOrders(orderData);
            } catch (err) {
                console.error("Lỗi hệ thống khi gọi danh sách đơn hàng:", response?.data?.message || err);
                setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại sau!");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [activeTab]);

    // 3. Tiến hành lọc danh sách cục bộ dựa theo ô tìm kiếm (Mã đơn hoặc Tên sản phẩm)
    const displayedOrders = orders.filter((order) => {
        if (!debouncedSearch.trim()) return true;
        const keyword = debouncedSearch.toLowerCase();

        const matchCode = order.orderCode?.toLowerCase().includes(keyword);
        const matchProduct = order.items?.some(item =>
            item.productName?.toLowerCase().includes(keyword)
        );

        return matchCode || matchProduct;
    });
    // --- XỬ LÝ KHI BẤM NÚT "MUA LẠI" Ở MỖI ĐƠN HÀNG ---
    const handleOpenReorderModal = (orderItems) => {
        setSelectedOrderItems(orderItems || []);
        setShowReorderModal(true);
    };
    // Hàm Helper: Định nghĩa màu sắc & nhãn hiển thị cho từng Status của Backend
    const getStatusDetails = (status) => {
        switch (status) {
            case 'PENDING':
                return { text: 'Đang xử lý', color: 'text-warning' };
            case 'SHIPPING':
                return { text: 'Đang giao', color: 'text-info' };
            case 'DELIVERED':
                return { text: 'Đã giao', color: 'text-success' };
            case 'CANCELLED':
                return { text: 'Đã hủy', color: 'text-danger' };
            default:
                return { text: 'Trả hàng', color: 'text-secondary' };
        }
    };

    // Hàm Helper: Format định dạng tiền tệ Việt Nam (VND)
    const formatCurrency = (amount) => {
        if (typeof amount !== 'number') return '0đ';
        return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
    };

    // Hàm Helper: Chuyển đổi định dạng ngày ISO sang DD/MM/YYYY chuẩn UI mẫu
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <div className="w-100">
            {/* THANH ĐIỀU HƯỚNG TABS VÀ TÌM KIẾM (Giao diện chuẩn ảnh) */}
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4 border-bottom bg-white rounded-3 p-2 shadow-sm">

                {/* Thanh Tabs ngang sử dụng Nav Pills mượt mà */}
                <Nav
                    variant="pills"
                    activeKey={activeTab}
                    onSelect={(key) => setActiveTab(key)}
                    className="flex-nowrap overflow-auto custom-order-tabs pb-1"
                >
                    <Nav.Item>
                        <Nav.Link eventKey="ALL" className={`px-3 py-2 fw-medium ${activeTab === 'ALL' ? 'active-tab' : 'text-secondary'}`}>Tất cả</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="PENDING" className={`px-3 py-2 fw-medium ${activeTab === 'PENDING' ? 'active-tab' : 'text-secondary'}`}>Đang xử lý</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="SHIPPING" className={`px-3 py-2 fw-medium ${activeTab === 'SHIPPING' ? 'active-tab' : 'text-secondary'}`}>Đang giao</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="DELIVERED" className={`px-3 py-2 fw-medium ${activeTab === 'DELIVERED' ? 'active-tab' : 'text-secondary'}`}>Đã giao</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="CANCELLED" className={`px-3 py-2 fw-medium ${activeTab === 'CANCELLED' ? 'active-tab' : 'text-secondary'}`}>Đã hủy</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="RETURNED" className={`px-3 py-2 fw-medium ${activeTab === 'RETURNED' ? 'active-tab' : 'text-secondary'}`}>Trả hàng</Nav.Link>
                    </Nav.Item>
                </Nav>

                {/* Thanh tìm kiếm bên phải */}
                <InputGroup className="bg-light rounded-3 overflow-hidden border-0 shadow-sm" style={{ maxWidth: '380px' }}>
                    <Form.Control
                        placeholder="Tìm theo tên đơn, mã đơn, hoặc tên sản phẩm..."
                        className="bg-light border-0 small py-2 ps-3 shadow-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                setDebouncedSearch(searchTerm); // Kích hoạt tìm kiếm ngay lập tức khi nhấn Enter
                            }
                        }}
                    />
                    <InputGroup.Text
                        className="bg-light border-0 text-secondary pe-3"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setDebouncedSearch(searchTerm)} // Kích hoạt tìm kiếm ngay khi click
                    >
                        <Search size={18} />
                    </InputGroup.Text>
                </InputGroup>
            </div>

            {/* PHẦN LOGIC HIỂN THỊ CHÍNH */}
            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" style={{ color: '#1250dc' }} />
                    <p className="text-muted mt-2 small">Đang tải danh sách đơn hàng ...</p>
                </div>
            ) : error ? (
                <Alert variant="danger" className="rounded-4 border-0 shadow-sm">{error}</Alert>
            ) : displayedOrders.length === 0 ? (
                <div className="text-center py-5 bg-white">
                    {/* Tiêu đề in đậm, màu chữ tối đặc trưng (fs-5 hoặc fw-bold) */}
                    <img src={orderEmpty} alt="No orders" className="img-fluid mb-3 d-block mx-auto" style={{ maxWidth: '300px' }} />
                    <h5 className="fw-bold text-dark mb-2" style={{ color: '#2c333f' }}>
                        Bạn chưa có đơn hàng nào.
                    </h5>

                    {/* Đoạn mô tả chữ nhỏ hơn, màu xám nhạt và có khoảng cách dòng thoải mái */}
                    <p className="text-muted small mb-4 px-3" style={{ maxWidth: '400px', margin: '0 auto', lineHeight: '1.5' }}>
                        Cùng khám phá hàng ngàn sản phẩm tại Nhà thuốc Quốc Thái nhé!
                    </p>

                    {/* Nút bấm bo tròn hoàn toàn, đổ màu xanh coban chuẩn thương hiệu */}
                    <button
                        onClick={() => navigate('/')} // Điều hướng về trang chủ khi click
                        className="btn text-white fw-bold px-4 py-2 rounded-pill shadow-sm"
                        style={{
                            backgroundColor: '#1250dc',
                            border: 'none',
                            fontSize: '15px',
                            paddingLeft: '2rem',
                            paddingRight: '2rem'
                        }}
                    >
                        Khám phá ngay
                    </button>
                </div>
            ) : (
                displayedOrders.map((order) => {
                    const statusInfo = getStatusDetails(order.status);

                    return (
                        <Card key={order.id} className="border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                            {/* Card Header */}
                            <Card.Header className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                                <div className="text-muted small">
                                    <span className="fw-bold text-dark fs-6">Đơn hàng {formatDate(order.createdAt)}</span>
                                    <span className="mx-2">•</span>
                                    <span>Giao hàng tận nơi</span>
                                    <span className="mx-2">•</span>
                                    <span>#{order.orderCode}</span>
                                </div>
                                <span className={`fw-bold small ${statusInfo.color}`}>
                                    • {statusInfo.text}
                                </span>
                            </Card.Header>

                            {/* Card Body hiển thị danh sách Items sản phẩm thuộc đơn hàng */}
                            <Card.Body className="px-4 py-1">
                                {order.items?.map((item, idx) => (
                                    <div key={item.id || idx} className="d-flex align-items-center justify-content-between py-3 border-bottom border-light item-row">
                                        <div className="d-flex align-items-center gap-3">
                                            {/* Ô chứa ảnh sản phẩm */}
                                            <div className="border rounded-3 p-1 bg-white d-flex align-items-center justify-content-center" style={{ width: '70px', height: '70px', minWidth: '70px' }}>
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.productName}
                                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                    onError={(e) => { e.target.src = "https://placehold.co/70x70?text=DuocPham"; }}
                                                />
                                            </div>
                                            {/* Chi tiết Tên và Quy cách đóng gói */}
                                            <div>
                                                <p className="mb-1 fw-medium text-dark small text-wrap text-break" style={{ maxWidth: '480px', lineHeight: '1.4' }}>
                                                    {item.productName}
                                                </p>
                                                <span className="text-muted small text-start">
                                                    x{item.quantity} {item.variantName || 'Ống'}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Đơn giá sản phẩm */}
                                        <div className="text-end pl-2">
                                            <span className="fw-bold text-dark ">{formatCurrency(item.priceAtTime)}</span>
                                        </div>
                                    </div>
                                ))}
                            </Card.Body>

                            {/* Card Footer chứa Tổng tiền và Nút tương tác */}
                            <Card.Footer className="bg-white border-top-0 pb-3 pt-2 px-4">
                                {/* Hàng 1: Xem chi tiết (bên trái) và Thành tiền (bên phải) */}
                                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                                    <span
                                        className="small text-primary fw-medium"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/profile/orders/${order.orderCode}`)} // <-- Sửa chính xác đường dẫn này
                                    >
                                        Xem chi tiết &gt;
                                    </span>
                                    <div className="text-end">
                                        <p className="mb-0 small text-muted">
                                            Thành tiền: <span className="fw-bold text-primary  ms-1">{formatCurrency(order.finalAmount)}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end">
                                    <Button
                                        variant="primary"
                                        className="rounded-pill px-4 btn-sm fw-bold shadow-sm"
                                        style={{ backgroundColor: '#1250dc', border: 'none', padding: '6px 22px' }}
                                        onClick={() => handleOpenReorderModal(order.items)}
                                    >
                                        Mua lại
                                    </Button>
                                </div>
                            </Card.Footer>
                        </Card>
                    );
                })
            )
            }
            <ReBuyModal
                show={showReorderModal}
                onHide={() => setShowReorderModal(false)}
                selectedOrderItems={selectedOrderItems}
            />

        </div >
    );
};

export default MyOrders;