import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from '../../admin/header/Header';
import LogoAdmin from '../../assets/logo-icon-admin.svg'

const PharmacistLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sidebarPinned, setSidebarPinned] = useState(true);
    const [isDark, setIsDark] = useState(() => localStorage.getItem('adminTheme') === 'dark');
    const location = useLocation();
    const navigate = useNavigate();

    // Hàm kiểm tra xem URL hiện tại có thuộc về các trang con của Conversation không
    const checkIsConversationRoute = (pathname) => {
        return (
            pathname.startsWith('/pharmacist/conversations')

        );
    };
    const checkIsReviewRoute = (pathname) => {
        return (
            pathname.startsWith('/pharmacist/reviews')
        );
    };

    // Khởi tạo trạng thái mở của Conversation dựa trên URL hiện tại
    const [conversationOpen, setConversationOpen] = useState(checkIsConversationRoute(location.pathname));
    const [reviewsOpen, setReviewsOpen] = useState(checkIsReviewRoute(location.pathname));
    /**
     * ⚡ AUTOMATIC SIDEBAR CONTROL
     */
    useEffect(() => {
        if (!checkIsConversationRoute(location.pathname)) {
            setConversationOpen(false);
        } else {
            setConversationOpen(true);
        }
    }, [location.pathname]);
    useEffect(() => {
        if (!checkIsReviewRoute(location.pathname)) {
            setReviewsOpen(false);
        } else {
            setReviewsOpen(true);
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

    // Style cho nút Conversation (Chỉ xanh khi đang ở trong các trang con của nó)
    const isConversationActive = checkIsConversationRoute(location.pathname);
    const conversationParentClass = isConversationActive
        ? `flex w-full items-center rounded-[6px] py-2 text-[15px] font-medium no-underline transition-all duration-200 bg-[#EBF0FF] text-[#3C50E0] dark:bg-[#1E3A8A] dark:text-[#BFDBFE] ${sidebarOpen ? 'justify-between px-2' : 'justify-center px-0'}`
        : `flex w-full items-center rounded-[6px] py-2 text-[15px] font-medium no-underline transition-all duration-200 text-[#4A5568] hover:bg-[#F1F5F9] hover:text-[#1C2434] dark:text-[#CBD5E1] dark:hover:bg-[#1E293B] dark:hover:text-white ${sidebarOpen ? 'justify-between px-2' : 'justify-center px-0'}`;

    // Style cho nút E-commerce (Chỉ xanh khi đang ở trong các trang con của nó)
    const isReviewsActive = checkIsReviewRoute(location.pathname);
    const reviewsParentClass = isReviewsActive
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
        <div className={`flex min-h-screen w-full overflow-x-hidden  bg-[#F1F5F9] text-[#1C2434] font-sans antialiased dark:bg-[#0F172A] dark:text-[#F8FAFC] ${isDark ? 'dark' : ''}`}>

            {/* SIDEBAR VỚI HIỆU ỨNG TRƯỢT SMOOTH */}
            {/* FIX 2: Ép chiều cao h-full (bằng 100vh), dùng overflow-y-auto để tự cuộn nội bộ, thêm 'scrollbar-none' để ẩn thanh cuộn */}
            <aside
                onMouseEnter={handleSidebarMouseEnter}
                onMouseLeave={handleSidebarMouseLeave}
                className={`fixed inset-y-0 left-0 z-[9999] flex h-screen flex-col border-r border-[#E2E8F0] bg-white  transition-all duration-300 ease-in-out overflow-x-hidden overflow-y-auto scrollbar-none dark:border-[#1E293B] dark:bg-[#111827] ${sidebarOpen ? 'w-[290px] px-3' : 'w-[88px] px-4 [&_.menu-item]:hidden [&_.sidebar-expanded-only]:hidden'
                    }`}
                style={{
                    msOverflowStyle: 'none',  /* Ẩn thanh cuộn trên IE và Edge */
                    scrollbarWidth: 'none'    /* Ẩn thanh cuộn trên Firefox */
                }}
            >
                {/* Bọc nội dung để đảm bảo padding bottom không bị che khuất khi cuộn xuống cuối */}
                <div className="pb-8">
                    {/* Logo Brand Head */}
                    <div onClick={() => navigate('/pharmacist')}
                        style={{ cursor: 'pointer' }}
                        className={`flex items-center py-8 ${sidebarOpen ? 'gap-3 px-2' : 'justify-center px-0'}`}>
                        <img src={LogoAdmin} alt="admin" className="h-10 w-10 flex-shrink-0" />
                        <span className={`text-xl font-bold tracking-tight text-[#1C2434] whitespace-nowrap overflow-hidden transition-all duration-200 dark:text-[#F8FAFC] ${sidebarOpen ? 'max-w-[180px] opacity-100' : 'max-w-0 opacity-0'}`}>Pharmacist</span>
                    </div>


                    {/* Label Category: MENU */}
                    <p className={`mb-4 px-2 text-[12px] font-semibold tracking-wider text-[#8A99AD] uppercase ${sidebarOpen ? 'text-start' : 'text-center text-lg leading-none'}`}>
                        {sidebarOpen ? 'Menu' : '...'}
                    </p>

                    <nav className="flex flex-col gap-1.5">


                        {/* CỤM MENU QUẢN LÝ  đánh giá */}
                        <button
                            onClick={() => navigate('/pharmacist/products')}
                            className={getMenuClass(location.pathname === '/pharmacist/products')}
                        >
                            <div className="flex items-center gap-3.5">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" >
                                    <path fillRule="evenodd" clipRule="evenodd" fill='currentColor' d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784Z" ></path>
                                </svg>
                                <span className="menu-item">Sản phẩm</span>
                            </div>
                        </button>

                        {/* CỤM MENU QUẢN LÝ  đánh giá */}
                        <button
                            onClick={() => navigate('/pharmacist/prescriptions')}
                            className={getMenuClass(location.pathname.startsWith('/pharmacist/prescriptions'))}
                        >
                            <div className="flex items-center gap-3.5">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M8 3.5h5.25L18 8.25V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5a1.5 1.5 0 0 1 2-1.5Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 3.75V8h4.25" />
                                </svg>
                                <span className="menu-item">Đơn thuốc</span>
                            </div>
                        </button>

                        <div>
                            <button
                                type="button"
                                onClick={() => setReviewsOpen(!reviewsOpen)}
                                className={reviewsParentClass}
                            >
                                <div className="flex items-center gap-3.5">
                                    <svg
                                        className="w-5 h-5 text-[#64748B] hover:text-[#1C2434] transition-colors"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        <polygon points="12 7 13.18 9.37 15.8 9.63 13.85 11.37 14.41 13.93 12 12.52 9.59 13.93 10.15 11.37 8.2 9.63 10.82 9.37 12 7" />
                                    </svg>
                                    <span className='menu-item'>Đánh giá</span>
                                </div>
                                <svg className={`sidebar-expanded-only w-4 h-4 text-gray-400 transition-transform duration-200 ${reviewsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            <div className={`sidebar-expanded-only flex flex-col gap-1 overflow-hidden transition-all duration-300 ${reviewsOpen ? 'max-h-[400px] mt-1 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <NavLink to="/pharmacist/reviews" end className={subMenuClass} style={{ color: 'unset', textDecoration: 'none' }}>Danh sách đánh giá</NavLink>

                            </div>
                        </div>

                        {/* 3. QUẢN LÝ TƯ VẤN */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setConversationOpen(!conversationOpen)}
                                className={conversationParentClass}
                            >
                                <div className="flex items-center gap-3.5">
                                    {/* Icon Kiện hàng / Sản phẩm chuẩn Admin */}
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span className='menu-item'>Tư vấn</span>
                                </div>
                                <svg className={`sidebar-expanded-only w-4 h-4 text-gray-400 transition-transform duration-200 ${conversationOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            <div className={`sidebar-expanded-only flex flex-col gap-1 overflow-hidden transition-all duration-300 ${conversationOpen ? 'max-h-[400px] mt-1 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <NavLink to="/pharmacist/conversations" end className={subMenuClass} style={{ color: 'unset', textDecoration: 'none' }}>Danh sách tư vấn</NavLink>


                            </div>
                        </div>



                        {/* 6. USER PROFILE */}
                        <button
                            onClick={() => navigate('/pharmacist/profile')}
                            className={getMenuClass(location.pathname === '/pharmacist/profile')}
                        >
                            <div className="flex items-center gap-3.5">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" >
                                    <path fillRule="evenodd" clipRule="evenodd" fill='currentColor' d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784Z" ></path>
                                </svg>
                                <span className="menu-item">Hồ sơ cá nhân</span>
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
            <div
                className={`flex flex-col w-full min-w-0 transition-all duration-300 ${sidebarOpen ? 'lg:ml-[290px]' : 'lg:ml-[88px]'
                    }`}
            >
                {/* Header đứng yên cố định ở trên đầu */}
                <div className="fixed top-0 z-[99] bg-[#F1F5F9] dark:bg-[#0F172A]" style={{ width: '-webkit-fill-available' }}>
                    <Header onToggle={handleToggleSidebar} sidebarOpen={sidebarOpen} isDark={isDark} onToggleTheme={handleToggleTheme} />
                </div>

                {/* FIX 4: Chỉ duy nhất phần main chứa Outlet được quyền scroll dọc độc lập */}
                <main className="flex-1 w-full max-w-full overflow-x-hidden p-6 pb-12" style={{ marginTop: '88px' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default PharmacistLayout;
