import { useState } from "react";
import { useSelector } from "react-redux";

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const notifications = ["New order received", "Product stock is low", "New user registered"];
    const { user } = useSelector(state => state.auth);


    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full   h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" height="20" width="20" className="fill-current">
                    <path fillRule="evenodd" fill="currentColor" d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z" />
                </svg>
                {/* Chấm đỏ báo hiệu tin chưa đọc */}
                {/* khi nào có thông mới mới hiển thị */}
                {/* <span className="absolute right-3.5 top-3.5 h-2 w-2 rounded-full bg-[#E10E0E]"></span> */}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xl z-[9999]">
                    <div className="mb-3 flex items-center justify-between">
                        <h5 className="font-semibold text-[#1C2434]">Notifications</h5>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-black">✕</button>
                    </div>
                    <div className="flex flex-col gap-2">
                        {notifications.map((item, index) => (
                            <div key={index} className="rounded-lg border border-gray-50 p-3 text-[14px] text-[#4A5568] hover:bg-[#F1F5F9] transition-colors cursor-pointer">
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}