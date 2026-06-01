import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from '../header/Header';
import './AdminLayout.scss'; // Import file SCSS cho AdminLayout
import LogoAdmin from '../../assets/logo-icon-admin.svg'

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sidebarPinned, setSidebarPinned] = useState(true);
    const [isDark, setIsDark] = useState(() => localStorage.getItem('adminTheme') === 'dark');
    const location = useLocation();
    const navigate = useNavigate();

    // Hàm kiểm tra xem URL hiện tại có thuộc về các trang con của E-commerce không
    const checkIsEcommerceRoute = (pathname) => {
        return (
            pathname.startsWith('/admin/ecommerce') ||
            pathname.includes('product') ||
            pathname.includes('categories') ||
            pathname.includes('invoice') ||
            pathname.includes('transaction') ||
            pathname.includes('billing')
        );
    };
    const checkIsOrdersRoute = (pathname) => {
        return (
            pathname.startsWith('/admin/orders') ||
            pathname.includes('orders/')
        );
    };

    // Khởi tạo trạng thái mở của E-commerce dựa trên URL hiện tại
    const [ecommerceOpen, setEcommerceOpen] = useState(checkIsEcommerceRoute(location.pathname));
    const [ordersOpen, setOrdersOpen] = useState(checkIsOrdersRoute(location.pathname));

    /**
     * ⚡ AUTOMATIC SIDEBAR CONTROL
     */
    useEffect(() => {
        if (!checkIsEcommerceRoute(location.pathname)) {
            setEcommerceOpen(false);
        } else {
            setEcommerceOpen(true);
        }
    }, [location.pathname]);
    useEffect(() => {
        if (!checkIsOrdersRoute(location.pathname)) {
            setOrdersOpen(false);
        } else {
            setOrdersOpen(true);
        }
    }, [location.pathname]);

    useEffect(() => {
        localStorage.setItem('adminTheme', isDark ? 'dark' : 'light');
    }, [isDark]);

    // Hàm trả về Class định dạng cho các nút Menu cha dạng <button>
    const getMenuClass = (isActive) =>
        `flex w-full items-center rounded-[6px] py-2 text-[15px] font-medium transition-all duration-200 ${sidebarOpen ? 'justify-between px-2' : 'justify-center px-0'} ${isActive
            ? 'bg-[#EBF0FF] text-[#3C50E0] dark:bg-[#1E3A8A] dark:text-[#BFDBFE]'
            : 'text-[#4A5568] hover:bg-[#F1F5F9] hover:text-[#1C2434] dark:text-[#CBD5E1] dark:hover:bg-[#1E293B] dark:hover:text-white'
        }`;

    // Style cho nút E-commerce (Chỉ xanh khi đang ở trong các trang con của nó)
    const isEcommerceActive = checkIsEcommerceRoute(location.pathname);
    const ecommerceParentClass = isEcommerceActive
        ? `flex w-full items-center rounded-[6px] py-2 text-[15px] font-medium no-underline transition-all duration-200 bg-[#EBF0FF] text-[#3C50E0] dark:bg-[#1E3A8A] dark:text-[#BFDBFE] ${sidebarOpen ? 'justify-between px-2' : 'justify-center px-0'}`
        : `flex w-full items-center rounded-[6px] py-2 text-[15px] font-medium no-underline transition-all duration-200 text-[#4A5568] hover:bg-[#F1F5F9] hover:text-[#1C2434] dark:text-[#CBD5E1] dark:hover:bg-[#1E293B] dark:hover:text-white ${sidebarOpen ? 'justify-between px-2' : 'justify-center px-0'}`;

    // Style cho nút E-commerce (Chỉ xanh khi đang ở trong các trang con của nó)
    const isOrdersActive = checkIsOrdersRoute(location.pathname);
    const ordersParentClass = isOrdersActive
        ? `flex w-full items-center rounded-[6px] py-2 text-[15px] font-medium no-underline transition-all duration-200 bg-[#EBF0FF] text-[#3C50E0] dark:bg-[#1E3A8A] dark:text-[#BFDBFE] ${sidebarOpen ? 'justify-between px-2' : 'justify-center px-0'}`
        : `flex w-full items-center rounded-[6px] py-2 text-[15px] font-medium no-underline transition-all duration-200 text-[#4A5568] hover:bg-[#F1F5F9] hover:text-[#1C2434] dark:text-[#CBD5E1] dark:hover:bg-[#1E293B] dark:hover:text-white ${sidebarOpen ? 'justify-between px-2' : 'justify-center px-0'}`;

    // Style dành riêng cho các Sub-menu con thụt lề bên trong
    const subMenuClass = ({ isActive }) =>
        `text-start block rounded-[6px] ml-6 pl-4 pr-4 py-2 text-[14px] font-medium no-underline transition-all duration-200 ${isActive
            ? 'bg-[#EBF0FF] text-[#3C50E0] dark:bg-[#1E3A8A] dark:text-[#BFDBFE]'
            : 'text-[#64748B] hover:text-[#1C2434] dark:text-[#94A3B8] dark:hover:text-white '
        }`;

    // Mẹo tạo class active thủ công cho các route có param động như /edit/:slug
    const getDynamicSubMenuClass = (isManualActive) => {
        return `text-start block rounded-[6px] ml-6 pl-4 pr-4 py-2 text-[14px] font-medium no-underline transition-all duration-200 ${isManualActive
            ? 'bg-[#EBF0FF] text-[#3C50E0] dark:bg-[#1E3A8A] dark:text-[#BFDBFE]'
            : 'text-[#64748B] hover:text-[#1C2434] dark:text-[#94A3B8] dark:hover:text-white'
            }`;
    };

    const handleToggleSidebar = () => {
        setSidebarOpen((prev) => {
            const nextOpen = !prev;
            setSidebarPinned(nextOpen);
            return nextOpen;
        });
    };

    const handleToggleTheme = () => {
        setIsDark((prev) => !prev);
    };

    const handleSidebarMouseEnter = () => {
        if (!sidebarOpen) {
            setSidebarOpen(true);
        }
    };

    const handleSidebarMouseLeave = () => {
        if (!sidebarPinned) {
            setSidebarOpen(false);
        }
    };

    return (
        /* FIX 1: Giới hạn chiều cao toàn trang khít với 100vh và chặn scroll tổng */
        <div className={`flex h-screen w-screen overflow-hidden bg-[#F1F5F9] text-[#1C2434] font-sans antialiased dark:bg-[#0F172A] dark:text-[#F8FAFC] ${isDark ? 'dark' : ''}`}>

            {/* SIDEBAR VỚI HIỆU ỨNG TRƯỢT SMOOTH */}
            {/* FIX 2: Ép chiều cao h-full (bằng 100vh), dùng overflow-y-auto để tự cuộn nội bộ, thêm 'scrollbar-none' để ẩn thanh cuộn */}
            <aside
                onMouseEnter={handleSidebarMouseEnter}
                onMouseLeave={handleSidebarMouseLeave}
                className={`fixed inset-y-0 left-0 z-[9999] flex h-full flex-col border-r border-[#E2E8F0] bg-white shadow-sm transition-all duration-300 ease-in-out lg:static lg:translate-x-0 overflow-x-hidden overflow-y-auto scrollbar-none dark:border-[#1E293B] dark:bg-[#111827] ${sidebarOpen ? 'w-[290px] translate-x-0 px-3' : 'w-[88px] translate-x-0 px-4 [&_.menu-item]:hidden [&_.sidebar-expanded-only]:hidden'
                    }`}
                style={{
                    msOverflowStyle: 'none',  /* Ẩn thanh cuộn trên IE và Edge */
                    scrollbarWidth: 'none'    /* Ẩn thanh cuộn trên Firefox */
                }}
            >
                {/* Bọc nội dung để đảm bảo padding bottom không bị che khuất khi cuộn xuống cuối */}
                <div className="pb-8">
                    {/* Logo Brand Head */}
                    <div className={`flex items-center py-8 ${sidebarOpen ? 'gap-3 px-2' : 'justify-center px-0'}`}>
                        <img src={LogoAdmin} alt="admin" className="h-10 w-10 flex-shrink-0" />
                        <span className={`text-xl font-bold tracking-tight text-[#1C2434] whitespace-nowrap overflow-hidden transition-all duration-200 dark:text-[#F8FAFC] ${sidebarOpen ? 'max-w-[180px] opacity-100' : 'max-w-0 opacity-0'}`}>Nhà thuốc</span>
                    </div>

                    {/* Label Category: MENU */}
                    <p className={`mb-4 px-2 text-[12px] font-semibold tracking-wider text-[#8A99AD] uppercase ${sidebarOpen ? 'text-start' : 'text-center text-lg leading-none'}`}>
                        {sidebarOpen ? 'Menu' : '...'}
                    </p>

                    <nav className="flex flex-col gap-1.5">

                        {/* 1. DASHBOARD */}
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className={getMenuClass(location.pathname === '/admin/dashboard' || location.pathname === '/admin')}
                        >
                            <div className="flex items-center gap-3.5">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" >
                                    <path fill='currentColor' d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V8.99998C3.25 10.2426 4.25736 11.25 5.5 11.25H9C10.2426 11.25 11.25 10.2426 11.25 8.99998V5.5C11.25 4.25736 10.2426 3.25 9 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H9C9.41421 4.75 9.75 5.08579 9.75 5.5V8.99998C9.75 9.41419 9.41421 9.74998 9 9.74998H5.5C5.08579 9.74998 4.75 9.41419 4.75 8.99998V5.5ZM5.5 12.75C4.25736 12.75 3.25 13.7574 3.25 15V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H9C10.2426 20.75 11.25 19.7427 11.25 18.5V15C11.25 13.7574 10.2426 12.75 9 12.75H5.5ZM4.75 15C4.75 14.5858 5.08579 14.25 5.5 14.25H9C9.41421 14.25 9.75 14.5858 9.75 15V18.5C9.75 18.9142 9.41421 19.25 9 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V15ZM12.75 5.5C12.75 4.25736 13.7574 3.25 15 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V8.99998C20.75 10.2426 19.7426 11.25 18.5 11.25H15C13.7574 11.25 12.75 10.2426 12.75 8.99998V5.5ZM15 4.75C14.5858 4.75 14.25 5.08579 14.25 5.5V8.99998C14.25 9.41419 14.5858 9.74998 15 9.74998H18.5C18.9142 9.74998 19.25 9.41419 19.25 8.99998V5.5C19.25 5.08579 18.9142 4.75 18.5 4.75H15ZM15 12.75C13.7574 12.75 12.75 13.7574 12.75 15V18.5C12.75 19.7426 13.7574 20.75 15 20.75H18.5C19.7426 20.75 20.75 19.7427 20.75 18.5V15C20.75 13.7574 19.7426 12.75 18.5 12.75H15ZM14.25 15C14.25 14.5858 14.5858 14.25 15 14.25H18.5C18.9142 14.25 19.25 14.5858 19.25 15V18.5C19.25 18.9142 18.9142 19.25 18.5 19.25H15C14.5858 19.25 14.25 18.9142 14.25 18.5V15Z" />
                                </svg>
                                <span className='menu-item'>Dashboard</span>
                            </div>
                        </button>

                        {/* 2. AI ASSISTANT */}
                        <button
                            onClick={() => navigate('/admin/ai-assistant')}
                            className={getMenuClass(location.pathname === '/admin/ai-assistant')}
                        >
                            <div className="flex items-center gap-3.5">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 2.42969V7.70424M9.42261 13.673C10.0259 14.4307 10.9562 14.9164 12 14.9164C13.0438 14.9164 13.9742 14.4307 14.5775 13.673M20 12V18.5C20 19.3284 19.3284 20 18.5 20H5.5C4.67157 20 4 19.3284 4 18.5V12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" />
                                    <path d="M18.75 2.42969V2.43969M9.50391 9.875L9.50391 9.885M14.4961 9.875V9.885" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                </svg>
                                <span className='menu-item'>AI Assistant</span>
                                <span className="sidebar-expanded-only rounded-full bg-[#EAFBF4] px-2 py-0.5 text-[11px] font-bold text-[#10B981]">NEW</span>
                            </div>
                        </button>

                        {/* 3. CỤM MENU E-COMMERCE (ACCORDION) */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setEcommerceOpen(!ecommerceOpen)}
                                className={ecommerceParentClass}
                            >
                                <div className="flex items-center gap-3.5">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path d="M2.31641 4H3.49696C4.24468 4 4.87822 4.55068 4.98234 5.29112L5.13429 6.37161M5.13429 6.37161L6.23641 14.2089C6.34053 14.9493 6.97407 15.5 7.72179 15.5L17.0833 15.5C17.6803 15.5 18.2205 15.146 18.4587 14.5986L21.126 8.47023C21.5572 7.4795 20.8312 6.37161 19.7507 6.37161H5.13429Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                        <path d="M7.7832 19.5H7.7932M16.3203 19.5H16.3303" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                    </svg>
                                    <span className='menu-item'>Sản phẩm</span>
                                </div>
                                <svg className={`sidebar-expanded-only w-4 h-4 text-gray-400 transition-transform duration-200 ${ecommerceOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            <div className={`sidebar-expanded-only flex flex-col gap-1 overflow-hidden transition-all duration-300 ${ecommerceOpen ? 'max-h-[400px] mt-1 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <NavLink to="/admin/products" end className={subMenuClass} style={{ color: 'unset', textDecoration: 'none' }}>Sản phẩm</NavLink>
                                <NavLink to="/admin/products/create" end className={subMenuClass} style={{ color: 'unset', textDecoration: 'none' }}>Thêm sản phẩm</NavLink>
                                {/* FIX TẠI ĐÂY: Sử dụng kiểm tra động bằng `.includes('products/edit/')` thay vì so khớp cứng */}
                                <NavLink
                                    to="/admin/products/edit/slug"
                                    className={getDynamicSubMenuClass(location.pathname.includes('/admin/products/edit/'))}
                                    style={{ color: 'unset', textDecoration: 'none' }}
                                >
                                    Chỉnh sửa sản phẩm
                                </NavLink>
                                <NavLink to="/admin/categories" end className={subMenuClass} style={{ color: 'unset', textDecoration: 'none' }}>Danh mục</NavLink>
                                <NavLink to="/admin/create-invoice" end className={subMenuClass} style={{ color: 'unset', textDecoration: 'none' }}>Tạo hóa đơn</NavLink>
                                <NavLink to="/admin/transactions" end className={subMenuClass} style={{ color: 'unset', textDecoration: 'none' }}>Giao dịch</NavLink>
                                <NavLink to="/admin/single-transaction" end className={subMenuClass} style={{ color: 'unset', textDecoration: 'none' }}>Chi tiết giao dịch</NavLink>
                            </div>
                        </div>

                        {/* 4. CỤM MENU ORDER (ACCORDION) */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setOrdersOpen(!ordersOpen)}
                                className={ordersParentClass}
                            >
                                <div className="flex items-center gap-3.5">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path d="M2.31641 4H3.49696C4.24468 4 4.87822 4.55068 4.98234 5.29112L5.13429 6.37161M5.13429 6.37161L6.23641 14.2089C6.34053 14.9493 6.97407 15.5 7.72179 15.5L17.0833 15.5C17.6803 15.5 18.2205 15.146 18.4587 14.5986L21.126 8.47023C21.5572 7.4795 20.8312 6.37161 19.7507 6.37161H5.13429Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                        <path d="M7.7832 19.5H7.7932M16.3203 19.5H16.3303" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                    </svg>
                                    <span className='menu-item'>Đơn hàng</span>
                                </div>
                                <svg className={`sidebar-expanded-only w-4 h-4 text-gray-400 transition-transform duration-200 ${ordersOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            <div className={`sidebar-expanded-only flex flex-col gap-1 overflow-hidden transition-all duration-300 ${ordersOpen ? 'max-h-[400px] mt-1 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <NavLink to="/admin/orders" end className={subMenuClass} style={{ color: 'unset', textDecoration: 'none' }}>Đơn hàng</NavLink>
                                <NavLink
                                    to={location.pathname.includes('/admin/orders/') ? location.pathname : "/admin/orders"}
                                    className={getDynamicSubMenuClass(location.pathname.includes('/admin/orders/') && location.pathname !== '/admin/orders')}
                                    style={{ color: 'unset', textDecoration: 'none' }}
                                >
                                    Chi tiết đơn
                                </NavLink>
                            </div>
                        </div>

                        {/* 5. CALENDAR */}
                        <button
                            onClick={() => navigate('/admin/calendar')}
                            className={getMenuClass(location.pathname === '/admin/calendar')}
                        >
                            <div className="flex items-center gap-3.5">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="menu-item">Calendar</span>
                            </div>
                        </button>

                        {/* 6. USER PROFILE */}
                        <button
                            onClick={() => navigate('/admin/profile')}
                            className={getMenuClass(location.pathname === '/admin/profile')}
                        >
                            <div className="flex items-center gap-3.5">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" >
                                    <path fillRule="evenodd" clipRule="evenodd" fill='currentColor' d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784Z" ></path>
                                </svg>
                                <span className="menu-item">User Profile</span>
                            </div>
                        </button>
                    </nav>
                </div>
            </aside>

            {/* LỚP PHỦ BACKGROUND KHI MỞ MENU TRÊN MOBILE */}
            {sidebarOpen && sidebarPinned && (
                <div
                    className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={handleToggleSidebar}
                />
            )}

            {/* CONTENT AREA */}
            {/* FIX 3: Ép h-full, flex-col và overflow-hidden để khu vực này bám sát khung nhìn 100vh */}
            <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
                {/* Header đứng yên cố định ở trên đầu */}
                <Header onToggle={handleToggleSidebar} sidebarOpen={sidebarOpen} isDark={isDark} onToggleTheme={handleToggleTheme} />

                {/* FIX 4: Chỉ duy nhất phần main chứa Outlet được quyền scroll dọc độc lập */}
                <main className="flex-1 overflow-y-auto pb-12">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
