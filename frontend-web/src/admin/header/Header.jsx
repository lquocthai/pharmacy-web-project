import NotificationDropdown from "./NotificationDropdown";
import UserDropdown from "./UserDropdown";
import "./headerAdmin.scss";
import { useSelector } from "react-redux";

const Header = ({ onToggle, sidebarOpen, isDark, onToggleTheme }) => {
    const { user } = useSelector(state => state.auth);
    return (
        <header className="sticky top-0 z-[999] flex w-full border-b border-[#E2E8F0] bg-white  dark:border-[#1E293B] dark:bg-[#111827]">
            <div className="flex w-full items-center justify-between px-6 py-3">

                {/* LEFT SIDE: TOGGLE BUTTON & SEARCH BAR */}
                <div className="flex flex-1 items-center gap-6">

                    {/* BUTTON TOGGLE (Áp dụng cho cả Mobile và Desktop để trượt mượt) */}
                    <button
                        style={{ borderRadius: "0.5rem" }}
                        onClick={onToggle}
                        aria-label={sidebarOpen ? "Thu gọn sidebar" : "Mở sidebar"}
                        title={sidebarOpen ? "Thu gọn sidebar" : "Mở sidebar"}
                        className="items-center rounded-lg justify-center  w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-99999 dark:border-gray-800 flex dark:text-gray-400 lg:h-11 lg:w-11 xl:border "
                    >
                        {/* Icon Hamburger 3 vạch thanh mảnh giống ảnh */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12" width={16} height={12}  >
                            <path fill="currentColor" d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z" />
                        </svg>
                    </button>

                    {/* SEARCH INPUT BAR */}
                    {/* <div className="relative hidden max-w-[480px] flex-1 sm:block">
                        <span className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" width={20} height={20} viewBox="0 0 20 20" className="fill-gray-500 dark:fill-gray-400">
                                <path d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search or type command..."
                            className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/50 py-2.5 pl-12 pr-16 text-[15px] text-[#1C2434] placeholder-[#8A99AD] outline-none transition-all focus:border-[#3C50E0] focus:bg-white focus:ring-1 focus:ring-[#3C50E0] dark:border-[#1E293B] dark:bg-[#0F172A] dark:text-[#F8FAFC] dark:focus:bg-[#111827]"
                        />

                    </div> */}
                </div>

                {/* RIGHT SIDE: DARK MODE, NOTIFICATION & USER PROFILE */}
                <div className="flex items-center gap-4">

                    {/* Nút giả lập Dark mode (Trăng khuyết giống ảnh) */}
                    <button
                        type="button"
                        onClick={onToggleTheme}
                        aria-label={isDark ? "Bật giao diện sáng" : "Bật giao diện tối"}
                        title={isDark ? "Bật giao diện sáng" : "Bật giao diện tối"}
                        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-dark-900 h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                        style={{ hover: { backgroundColor: "#babec2", color: "var(--color-gray-700)" } }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-[22px] h-[22px]">
                            {isDark ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25M18.364 5.636l-1.591 1.591M21 12h-2.25M18.364 18.364l-1.591-1.591M12 18.75V21M7.227 16.773l-1.591 1.591M5.25 12H3M7.227 7.227 5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                            )}
                        </svg>
                    </button>

                    {/* Component thông báo thông minh */}
                    {/* <NotificationDropdown /> */}

                    {/* Thanh phân tách dọc nhẹ */}
                    <div className="h-6 w-px bg-[#E2E8F0]"></div>

                    {/* Component thông tin User */}
                    <UserDropdown />
                </div>
            </div>
        </header>
    );
};

export default Header;
