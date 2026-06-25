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


                </div>

                {/* RIGHT SIDE: DARK MODE, NOTIFICATION & USER PROFILE */}
                <div className="flex items-center gap-4">


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
