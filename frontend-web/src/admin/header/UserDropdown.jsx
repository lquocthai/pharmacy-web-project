import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

export default function UserDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useSelector(state => state.auth);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3.5 text-left"
            >
                {/* Phần text tên & quyền */}
                <div className="hidden text-right xl:block">
                    <span className="block text-[14px] font-semibold text-[#1C2434]">{user?.username}</span>
                    <span className="block text-[12px] text-[#64748B]">{user?.roles?.[0]?.name}</span>
                </div>

                {/* Avatar tròn viền nhẹ bên ảnh gốc */}
                <div className="h-11 w-11 rounded-full p-0.5 border border-[#E2E8F0]">
                    <img
                        src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                        alt="User Avatar"
                        className="h-full w-full rounded-full object-cover"
                    />
                </div>

                {/* Mũi tên Dropdown nhỏ nhắn */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3.5 h-3.5 text-[#64748B] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-xl z-[9999]">
                    <Link to="/profile" className="block rounded-lg px-4 py-2.5 text-[14px] text-[#4A5568] no-underline hover:bg-[#F1F5F9] hover:text-[#1C2434]">Profile</Link>
                    <Link to="/settings" className="block rounded-lg px-4 py-2.5 text-[14px] text-[#4A5568] no-underline hover:bg-[#F1F5F9] hover:text-[#1C2434]">Settings</Link>
                    <hr className="my-1.5 border-[#E2E8F0]" />
                    <Link to="/signin" className="block rounded-lg px-4 py-2.5 text-[14px] font-medium text-[#D32F2F] no-underline hover:bg-red-50">Logout</Link>
                </div>
            )}
        </div>
    );
}