import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { openLoginModal, setLogout } from '../redux/slices/authSlice';
import {
    FaMapMarkerAlt, FaPhoneAlt,
    FaUserCircle, FaShoppingCart, FaMicrophone,
    FaSearch, FaBars, FaTimes
} from 'react-icons/fa';
import '../assets/styles/Header.scss';
import LogoutModal from '../components/Auth/LogoutModal';
import { LogOut, MapPin, Package, Pill, User } from 'lucide-react';
import elasticSearchService from '../services/elasticSearchService.js';
import categoryService from '../services/categoryService.js';

export default function Header() {
    const [searchValue, setSearchValue] = useState('');
    const [categories, setCategories] = useState([]);
    const [navOpen, setNavOpen] = useState(false);
    const [showLogout, setShowLogout] = useState(false);

    // States cho việc gợi ý tìm kiếm & loading
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Thêm state quản lý trạng thái chờ dữ liệu API
    const dropdownRef = useRef(null);

    const { totalItems } = useSelector((state) => state.cart);
    const cart = useSelector((state) => state.cart);
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        fetchCategories();

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 🔥 LOGIC DEBOUNCE SEARCH (0.5 giây) CÓ XỬ LÝ SKELETON LOADING
    useEffect(() => {
        if (!searchValue.trim()) {
            setSuggestions([]);
            setShowDropdown(false);
            setIsLoading(false);
            return;
        }

        // Ngay khi người dùng gõ tiếp ký tự, kích hoạt trạng thái loading mờ và bật dropdown
        setIsLoading(true);
        setShowDropdown(true);

        const delayDebounceFn = setTimeout(async () => {
            try {
                const response = await elasticSearchService.getSuggestions(searchValue.trim(), 3);
                setSuggestions(response.data.result || []);
            } catch (error) {
                console.error('Lỗi lấy dữ liệu gợi ý:', error);
                setSuggestions([]);
            } finally {
                // Kết thúc tiến trình API, tắt hiệu ứng xoay mờ để hiển thị data thật/thông báo trống
                setIsLoading(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchValue]);

    const fetchCategories = async () => {
        try {
            const response = await categoryService.getAll();
            setCategories(response.data?.result || []);
        } catch (error) {
            console.error('Fetch categories error:', error);
        }
    };

    const performSearch = (keyword) => {
        if (keyword.trim()) {
            navigate(`/products?search=${encodeURIComponent(keyword.trim())}`);
            setShowDropdown(false);
            setNavOpen(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        performSearch(searchValue);
    };

    const goToDetail = (productSlug) => {
        if (productSlug) {
            navigate(`/products/detail/${productSlug}`);
            setNavOpen(false);
        }
    };

    const closeMobileNav = () => setNavOpen(false);

    return (
        <header className="main-header">
            <div className="header-bg">
                {/* ── Topbar ── */}
                <div className="header-topbar py-1 text-white">
                    <div className="container-xl d-flex align-items-center justify-content-between gap-2">
                        <span className="d-flex align-items-center gap-2 small topbar-address">
                            <FaMapMarkerAlt className="flex-shrink-0" />
                            <span className="text-truncate">Trung tâm nhà thuốc quốc thái</span>
                        </span>
                        <a href="tel:18006928" className="text-white text-decoration-none small d-flex align-items-center gap-1 flex-shrink-0">
                            <FaPhoneAlt />
                            <span className="d-none d-md-inline">Tư vấn ngay: <strong>1234 5678</strong></span>
                        </a>
                    </div>
                </div>

                {/* ── Main Header ── */}
                <div className="header-main py-3 py-lg-4">
                    <div className="container-xl d-flex align-items-center flex-wrap gap-2 gap-lg-3">
                        {/* Logo */}
                        <Link to="/" className="header-logo text-decoration-none text-white flex-shrink-0 order-1" onClick={closeMobileNav}>
                            <div className="logo-retail" style={{ fontSize: '10px', opacity: 0.9 }}>NLU</div>
                            <div className="logo-name fw-bold" style={{ fontSize: '18px', lineHeight: 1 }}>NHÀ THUỐC</div>
                            <div className="logo-brand fw-bold " style={{ fontSize: '22px' }}>QUỐC THÁI</div>
                        </Link>

                        {/* Khu vực Account & Cart & Mobile toggle */}
                        <div className="header-actions d-flex align-items-center gap-2 ms-auto order-2 order-lg-3">
                            {/* Account - chỉ hiện ở desktop, ở mobile/tablet chuyển vào menu */}
                            {isAuthenticated ? (
                                <div className="user-profile-dropdown position-relative d-none d-lg-flex">
                                    <Link to="/profile" className="btn d-flex align-items-center gap-2 text-white border-0 bg-transparent shadow-none p-2">
                                        <FaUserCircle size={24} />
                                        <div className="text-start">
                                            <div className="small fw-bold lh-1">{user?.username || 'Thành viên'}</div>
                                        </div>
                                    </Link>
                                    <ul className="custom-dropdown-menu shadow border-0 mt-0">
                                        <li>
                                            <Link className="dropdown-item py-2 small" to="/profile">
                                                <div className="d-flex align-items-center gap-3"><User size={18} /><span>Thông tin cá nhân</span></div>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className="dropdown-item py-2 small" to="/profile?tab=address">
                                                <div className="d-flex align-items-center gap-3"><MapPin size={18} /><span>Quản lý địa chỉ</span></div>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className="dropdown-item py-2 small" to="/profile?tab=orders">
                                                <div className="d-flex align-items-center gap-3"><Package size={18} /><span>Đơn hàng của tôi</span></div>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className="dropdown-item py-2 small" to="/profile?tab=prescriptions">
                                                <div className="d-flex align-items-center gap-3"><Pill size={18} /><span>Đơn thuốc của tôi</span></div>
                                            </Link>
                                        </li>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li>
                                            <button className="dropdown-item py-2 small" onClick={() => setShowLogout(true)}>
                                                <div className="d-flex align-items-center gap-3"><LogOut size={18} /><span>Đăng xuất</span></div>
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            ) : (
                                <button onClick={() => dispatch(openLoginModal())} className="btn d-none d-lg-flex align-items-center gap-2 text-white border-0 bg-transparent shadow-none p-2">
                                    <FaUserCircle size={24} />
                                    <span className="small fw-bold">Đăng nhập</span>
                                </button>
                            )}

                            {/* Cart - luôn hiển thị trên mọi kích thước màn hình */}
                            <div className="cart-container position-relative">
                                <Link to="/cart" className="btn btn-cart text-white d-flex align-items-center gap-2 px-3 rounded-pill bg-blue-5" onClick={closeMobileNav}>
                                    <div className="position-relative">
                                        <FaShoppingCart size={18} />
                                        {/* {totalItems > 0 && (
                                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle" style={{ backgroundColor: '#fa8c16', fontSize: '10px', padding: '2px 5px', marginTop: '-2px' }}>
                                                {totalItems}
                                            </span>
                                        )} */}
                                        {/* Thay thế đoạn hiển thị Badge số lượng cũ bằng đoạn này */}
                                        {totalItems > 0 && (
                                            <span
                                                //  SỬA: Thay 'start-100 translate-middle' thành 'top-0 end-0' để ôm sát vào trong nút, không bị đẩy tràn màn hình mobile
                                                className="position-absolute top-0 end-0 badge rounded-circle"
                                                style={{
                                                    backgroundColor: '#fa8c16',
                                                    fontSize: '10px',
                                                    padding: '2px 5px',
                                                    // 🛠️ Tinh chỉnh vị trí thủ công dịch lên góc một chút cho đẹp mắt trên mobile
                                                    marginTop: '-4px',
                                                    marginRight: '-4px',
                                                    zIndex: 2
                                                }}
                                            >
                                                {totalItems}
                                            </span>
                                        )}
                                    </div>
                                    <span className="small fw-bold d-none d-lg-inline">Giỏ hàng</span>
                                </Link>

                                {/* Cart preview dropdown - chỉ hiện ở desktop */}
                                {totalItems > 0 && (
                                    <div className="cart-dropdown shadow-sm border rounded p-3 bg-white position-absolute d-none d-lg-block" style={{ right: 0 }}>
                                        <h6 className="text-start mb-3 text-secondary">Giỏ hàng</h6>
                                        {cart.items.slice(0, 4).map(item => (
                                            <div key={item.id} className="d-flex align-items-center gap-2 mb-3" onClick={() => goToDetail(item.productSlug)} style={{ cursor: 'pointer' }}>
                                                <img className='border rounded' src={item.imageUrl} alt={item.productName} style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                                <div className="flex-grow-1" style={{ fontSize: '12px' }}>
                                                    <div className="text-truncate" style={{ maxWidth: '250px' }}>{item.productName}</div>
                                                    <div className="d-flex text-secondary" style={{ fontSize: '10px' }}>
                                                        <div className="text-primary fw-bold">{item.price.toLocaleString()}đ</div>
                                                        <div className="text-primary fw-bold ms-2">x{item.quantity} {item.variantName}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="d-flex align-items-center justify-content-between pt-2">
                                            <span className="text-start text-secondary small fw-bold">{totalItems} sản phẩm</span>
                                            <Link to="/cart" style={{ backgroundColor: 'rgb(18 80 220)' }} className="btn btn-primary btn-sm rounded-pill">Xem giỏ hàng</Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile/Tablet menu toggle */}
                            <button className="btn text-white d-lg-none p-1 shadow-none border-0" onClick={() => setNavOpen(!navOpen)}>
                                {navOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
                            </button>
                        </div>

                        {/* Khung Tìm kiếm + Dropdown Suggestions */}
                        <div className="header-search-wrapper position-relative round-full px-lg-4 order-3 order-lg-2" ref={dropdownRef}>
                            <form className="input-group header-search rounded-full" onSubmit={handleSearchSubmit}>
                                <input
                                    type="text"
                                    className="form-control border-0 shadow-none py-2"
                                    placeholder="Tìm kiếm thuốc, thực phẩm chức năng..."
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    onFocus={() => searchValue.trim() && setShowDropdown(true)}
                                />
                                <button type="button" className="btn btn-white border-0 text-secondary px-3 bg-white">
                                    <FaMicrophone />
                                </button>
                                <button type="submit" className="btn bg-blue-5 px-3 border-0">
                                    <FaSearch className="text-white" />
                                </button>
                            </form>

                            {/* 🔥 DROPDOWN GỢI Ý KẾT QUẢ TÌM KIẾM */}
                            {showDropdown && (
                                <div
                                    className="search-suggestions-dropdown position-absolute w-100 bg-white shadow rounded mt-1 border"
                                    style={{
                                        zIndex: 9999,
                                        overflowY: 'auto',
                                        top: '100%',
                                        left: 0
                                    }}
                                >
                                    {isLoading ? (
                                        /* ── TRƯỜNG HỢP LOADING: HIỂN THỊ CÁC THANH SKELETON NHẤP NHÁY MỜ MỜ ── */
                                        <div className="p-3 d-flex flex-column gap-3">
                                            {/* Tiêu đề mờ */}
                                            <div className="skeleton-line" style={{ width: '30%', height: '16px' }}></div>

                                            {/* Hàng sản phẩm mẫu 1 */}
                                            <div className="d-flex align-items-center gap-3 py-1">
                                                <div className="skeleton-line flex-shrink-0" style={{ width: '45px', height: '45px', borderRadius: '6px' }}></div>
                                                <div className="flex-grow-1 d-flex flex-column gap-2">
                                                    <div className="skeleton-line" style={{ width: '85%', height: '14px' }}></div>
                                                    <div className="skeleton-line" style={{ width: '40%', height: '12px' }}></div>
                                                </div>
                                            </div>

                                            {/* Hàng sản phẩm mẫu 2 */}
                                            <div className="d-flex align-items-center gap-3 py-1">
                                                <div className="skeleton-line flex-shrink-0" style={{ width: '45px', height: '45px', borderRadius: '6px' }}></div>
                                                <div className="flex-grow-1 d-flex flex-column gap-2">
                                                    <div className="skeleton-line" style={{ width: '70%', height: '14px' }}></div>
                                                    <div className="skeleton-line" style={{ width: '30%', height: '12px' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : suggestions.length > 0 ? (
                                        /* ── TRƯỜNG HỢP 1: CÓ SẢN PHẨM GỢI Ý ── */
                                        <>
                                            {suggestions.map((item) => (
                                                <div
                                                    key={item.id || item._id}
                                                    className="suggestion-item d-flex align-items-center gap-3 px-3 py-2 border-bottom style-row-search"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => {
                                                        goToDetail(item.slug);
                                                        setShowDropdown(false);
                                                    }}
                                                >
                                                    <img
                                                        src={item.primaryImageUrl || 'https://via.placeholder.com/45'}
                                                        alt={item.name}
                                                        style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                                                        className="border rounded flex-shrink-0"
                                                    />
                                                    <div className="flex-grow-1 min-w-0">
                                                        <div className="text-dark fw-medium text-truncate small d-flex align-items-center gap-2">
                                                            {item.prescription && (
                                                                <span className="badge bg-danger text-white flex-shrink-0" style={{ fontSize: '9px', padding: '2px 4px' }}>Rx</span>
                                                            )}
                                                            <span className="text-dark text-truncate">{item.name}</span>
                                                        </div>
                                                        <div className="text-start text-primary fw-bold small mt-1">
                                                            {item.priceDefault ? `${item.priceDefault.toLocaleString()}đ` : 'Liên hệ'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        /* ── TRƯỜNG HỢP 2: KHÔNG CÓ SẢN PHẨM GỢI Ý (HIỂN THỊ CHƯA TÌM THẤY) ── */
                                        <div className="p-3 text-dark style-no-result">
                                            <div className="d-flex align-items-start gap-2 mb-2" style={{ fontSize: '15px' }}>
                                                <FaSearch className="text-secondary mt-1" />
                                                <span>
                                                    Không tìm thấy kết quả với từ khóa <strong className="text-break">"{searchValue}"</strong>
                                                </span>
                                            </div>
                                            <hr className="text-muted my-2" />
                                            <ul className="text-start text-secondary small mb-0 ps-3" style={{ listStyleType: 'disc', lineHeight: '1.6' }}>
                                                <li>Kiểm tra lỗi chính tả với từ khoá đã nhập</li>
                                                <li>Thử tìm kiếm với một từ khóa khác ngắn gọn hơn</li>
                                                <li>
                                                    Trong trường hợp cần hỗ trợ, hãy liên hệ với chúng tôi qua tổng đài miễn phí <strong className="text-primary">1234 5678</strong>
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Category Navigation (Desktop) ── */}
            <nav className="header-nav bg-white border-bottom d-none d-lg-block">
                <div className="container-xl">
                    <ul className="nav-list d-flex align-items-center justify-content-center m-0 p-0 list-unstyled">
                        {categories.map((category) => (
                            <li key={category.id} className="nav-item px-3">
                                <Link to={`/products/${category.slug}`} className="nav-link">{category.name}</Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>

            {/* ── Mobile / Tablet menu panel ── */}
            {navOpen && (
                <div className="mobile-nav-panel d-lg-none bg-white border-top">
                    <div className="container-xl py-3">
                        {/* Tài khoản */}
                        <div className="pb-3 mb-3 border-bottom">
                            {isAuthenticated ? (
                                <>
                                    <div className="d-flex align-items-center gap-2 mb-2 text-dark fw-bold">
                                        <FaUserCircle size={22} />
                                        <span>{user?.username || 'Thành viên'}</span>
                                    </div>
                                    <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                                        <li>
                                            <Link to="/profile" className="d-flex align-items-center gap-2 text-dark text-decoration-none" onClick={closeMobileNav}>
                                                <User size={18} /><span>Thông tin cá nhân</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/profile?tab=address" className="d-flex align-items-center gap-2 text-dark text-decoration-none" onClick={closeMobileNav}>
                                                <MapPin size={18} /><span>Quản lý địa chỉ</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/profile?tab=orders" className="d-flex align-items-center gap-2 text-dark text-decoration-none" onClick={closeMobileNav}>
                                                <Package size={18} /><span>Đơn hàng của tôi</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/profile?tab=prescriptions" className="d-flex align-items-center gap-2 text-dark text-decoration-none" onClick={closeMobileNav}>
                                                <Pill size={18} /><span>Đơn thuốc của tôi</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <button
                                                className="btn btn-link p-0 d-flex align-items-center gap-2 text-danger text-decoration-none"
                                                onClick={() => { setShowLogout(true); closeMobileNav(); }}
                                            >
                                                <LogOut size={18} /><span>Đăng xuất</span>
                                            </button>
                                        </li>
                                    </ul>
                                </>
                            ) : (
                                <button
                                    className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                                    onClick={() => { dispatch(openLoginModal()); closeMobileNav(); }}
                                >
                                    <FaUserCircle size={20} /> Đăng nhập / Đăng ký
                                </button>
                            )}
                        </div>

                        {/* Danh mục */}
                        <div>
                            <h6 className="text-uppercase text-secondary small fw-bold mb-2">Danh mục sản phẩm</h6>
                            <ul className="list-unstyled mb-0">
                                {categories.map((category) => (
                                    <li key={category.id}>
                                        <Link
                                            to={`/products/${category.slug}`}
                                            className="d-block py-2 text-dark text-decoration-none border-bottom"
                                            onClick={closeMobileNav}
                                        >
                                            {category.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Liên hệ */}
                        <div className="mt-3 pt-3 border-top">
                            <a href="tel:18006928" className="d-flex align-items-center gap-2 text-decoration-none text-primary fw-bold">
                                <FaPhoneAlt /> Tư vấn ngay: 1234 5678
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <LogoutModal show={showLogout} handleClose={() => setShowLogout(false)} />
        </header>
    );
}
