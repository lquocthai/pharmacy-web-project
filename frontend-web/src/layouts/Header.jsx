import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { openLoginModal, setLogout } from '../redux/slices/authSlice';
import {
    FaMapMarkerAlt, FaPhoneAlt,
    FaUserCircle, FaShoppingCart, FaMicrophone,
    FaSearch, FaBars, FaTimes
} from 'react-icons/fa';
import '../assets/styles/Header.scss';
import authService from '../services/authService';
import LogoutModal from '../components/Auth/LogoutModal';

export default function Header() {
    // 1. Khai báo các state cần thiết để tránh lỗi ReferenceError
    const [searchValue, setSearchValue] = useState('');
    const [navOpen, setNavOpen] = useState(false);

    const [showLogout, setShowLogout] = useState(false);


    // 2. Lấy dữ liệu từ Redux Store
    const { totalItems } = useSelector((state) => state.cart);
    const cart = useSelector((state) => state.cart);
    console.log('Cart in Header:', cart); // Debug: kiểm tra dữ liệu cart
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // 3. Xử lý tìm kiếm
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchValue.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchValue.trim())}`);
            setNavOpen(false); // Đóng menu mobile nếu đang mở
        }
    };


    return (
        <header className="main-header">
            <div className="header-bg">
                {/* ── Topbar ── */}
                <div className="header-topbar py-1 text-white">
                    <div className="container-xl d-flex align-items-center justify-content-between">
                        <span className="d-flex align-items-center gap-2 small">
                            <FaMapMarkerAlt />
                            Trung tâm nhà thuốc quốc thái&nbsp;
                            {/* <Link to="/about" className="text-white fw-semibold text-decoration-none">Tìm hiểu ngay</Link> */}
                        </span>
                        <span className="d-none d-md-flex align-items-center gap-4">
                            <a href="tel:18006928" className="text-white text-decoration-none small d-flex align-items-center gap-1">
                                <FaPhoneAlt /> Tư vấn ngay: <strong>1800 6928</strong>
                            </a>
                        </span>
                    </div>
                </div>

                {/* ── Main Header ── */}
                <div className="header-main py-4">
                    <div className="container-xl d-flex align-items-center gap-3">
                        {/* Logo */}
                        <Link to="/" className="header-logo text-decoration-none text-white flex-shrink-0">
                            <div className="logo-retail" style={{ fontSize: '10px', opacity: 0.9 }}>NLU</div>
                            <div className="logo-name fw-bold" style={{ fontSize: '18px', lineHeight: 1 }}>NHÀ THUỐC</div>
                            <div className="logo-brand fw-bold " style={{ fontSize: '22px' }}>QUỐC THÁI</div>
                        </Link>

                        {/* Ô tìm kiếm */}
                        <form className="input-group header-search flex-grow-1" onSubmit={handleSearch}>
                            <input
                                type="text"
                                className="form-control border-0 shadow-none py-2"
                                placeholder="Tìm kiếm thuốc, thực phẩm chức năng..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                            <button type="button" className="btn btn-white border-0 text-secondary px-3 bg-white">
                                <FaMicrophone />
                            </button>
                            <button type="submit" className="btn bg-blue-5 px-3 border-0">
                                <FaSearch className="text-white" />
                            </button>
                        </form>

                        {/* Khu vực Account & Cart */}
                        <div className="d-none d-lg-flex align-items-center gap-2 flex-shrink-0">
                            {isAuthenticated ? (
                                /* Khu vực User đã đăng nhập */
                                <div className="user-profile-dropdown position-relative">
                                    <Link
                                        to="/profile"
                                        className="btn d-flex align-items-center gap-2 text-white border-0 bg-transparent shadow-none p-2"
                                    >
                                        <FaUserCircle size={24} />
                                        <div className="text-start">
                                            <div className="small fw-bold lh-1">
                                                {user?.username || 'Thành viên'}
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Menu nổi khi hover */}
                                    <ul className="custom-dropdown-menu shadow border-0 mt-0">
                                        <li>
                                            <Link className="dropdown-item py-2 small" to="/profile">
                                                Hồ sơ cá nhân
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className="dropdown-item py-2 small" to="/orders">
                                                Lịch sử đơn hàng
                                            </Link>
                                        </li>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li>
                                            <button
                                                className="dropdown-item py-2 small text-danger fw-bold"
                                                onClick={() => setShowLogout(true)}
                                            >
                                                Đăng xuất
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            ) : (
                                /* Nút Đăng nhập khi chưa có auth */
                                <button
                                    onClick={() => dispatch(openLoginModal())}
                                    className="btn d-flex align-items-center gap-2 text-white border-0 bg-transparent shadow-none p-2"
                                >
                                    <FaUserCircle size={24} />
                                    <span className="small fw-bold">Đăng nhập</span>
                                </button>
                            )}
                            {/* giỏ hàng */}
                            {/* Thay đoạn Link giỏ hàng cũ bằng đoạn này */}
                            <div className="cart-container position-relative ms-2">
                                <Link to="/cart" className="btn btn-cart text-white d-flex align-items-center gap-2 px-3 rounded-pill bg-blue-5">
                                    <div className="position-relative">
                                        <FaShoppingCart size={18} />
                                        {totalItems > 0 && (
                                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle"
                                                style={{ backgroundColor: '#fa8c16', fontSize: '9px', padding: '2px 5px', marginTop: '5px' }}>
                                                {totalItems}
                                            </span>
                                        )}
                                    </div>
                                    <span className="small fw-bold">Giỏ hàng</span>
                                </Link>

                                {/* Danh sách sản phẩm khi hover */}
                                {totalItems > 0 && (
                                    <div className="cart-dropdown shadow-sm border rounded p-3 bg-white position-absolute">
                                        <h6 className="mb-3 text-secondary">Sản phẩm mới thêm</h6>
                                        {cart.items.slice(0, 4).map(item => (
                                            <div key={item.id} className="d-flex align-items-center gap-2 mb-3">
                                                <img src={item.imageUrl} alt={item.productName} style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                                <div className="flex-grow-1" style={{ fontSize: '12px' }}>
                                                    <div className="text-truncate" style={{ maxWidth: '150px' }}>{item.productName}</div>
                                                    <div className="text-primary fw-bold">{item.price.toLocaleString()}đ</div>
                                                </div>
                                            </div>
                                        ))}
                                        <Link to="/cart" className="btn btn-primary w-100 btn-sm">Xem giỏ hàng</Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile Toggle Nút này dùng navOpen */}
                        <button
                            className="btn text-white d-lg-none ms-auto p-1 shadow-none border-0"
                            onClick={() => setNavOpen(!navOpen)}
                        >
                            {navOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                        </button>
                    </div>
                </div>
            </div>
            {/* ── Category Navigation (Dữ liệu cứng) ── */}
            <nav className="header-nav bg-white border-bottom d-none d-lg-block">
                <div className="container-xl">
                    <ul className="nav-list d-flex align-items-center justify-content-center m-0 p-0 list-unstyled">
                        {[
                            { name: 'Thực phẩm chức năng' },
                            { name: 'Dược mỹ phẩm' },
                            { name: 'Thuốc' },
                            { name: 'Chăm sóc cá nhân' },
                            { name: 'Thiết bị y tế' },
                        ].map((item, index) => (
                            <li key={index} className="nav-item px-3">
                                <Link to={item.path} className="nav-link">
                                    {item.name}
                                    {item.hasChild && <span className="dropdown-icon ms-1">▼</span>}
                                </Link>
                            </li>
                        ))}

                        {/* Mục cuối cùng thường có style khác biệt một chút */}
                        <li className="nav-item">
                            <Link to="/he-thong-cua-hang" className="nav-link text-primary fw-bold">
                                Hệ thống nhà thuốc
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>
            <LogoutModal
                show={showLogout}
                handleClose={() => setShowLogout(false)}
            />

        </header>
    );
}