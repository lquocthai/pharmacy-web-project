import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import userAdminService from '../service/userAdminService';
import LogoInfo from '../../assets/avatar-profile.svg';

const AdminUserPage = () => {
    const navigate = useNavigate();

    // ─────────────────────────────────────────────
    // STATES
    // ─────────────────────────────────────────────
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // State text hiển thị trong ô input (thay đổi liên tục khi gõ)
    const [searchTerm, setSearchTerm] = useState('');
    // State thực tế sẽ truyền vào API sau khi người dùng dừng gõ
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [statusFilter, setStatusFilter] = useState('');

    // Pagination
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    // Dropdown Action State
    const [activeDropdown, setActiveDropdown] = useState(null);

    // set role & set password modal state
    const [selectedUser, setSelectedUser] = useState(null);

    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

    const [selectedRole, setSelectedRole] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const openRoleModal = (user) => {
        console.log("OPEN ROLE", user);
        setSelectedUser(user);
        setSelectedRole(user.roles?.[0]?.name || '');
        setShowRoleModal(true);
    };
    const handleUpdateRole = async () => {
        try {
            await userAdminService.updateUser(
                selectedUser.id,
                selectedRole
            );

            toast.success('Cập nhật quyền thành công');

            setShowRoleModal(false);
            fetchUsers();
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                'Cập nhật quyền thất bại'
            );
        }
    };
    const openResetPasswordModal = (user) => {
        setSelectedUser(user);
        setNewPassword('');
        setShowResetPasswordModal(true);
    };
    const handleSubmitResetPassword = async () => {
        try {
            console.log("RESET PASSWORD", selectedUser, newPassword);
            const response = await userAdminService.resetPassword(
                selectedUser.id,
                newPassword
            );

            toast.success('Đặt lại mật khẩu thành công');

            setShowResetPasswordModal(false);
        } catch (error) {
            toast.error(
                'Đặt lại mật khẩu thất bại'
            );
        }
    };

    // ─────────────────────────────────────────────
    // EFFECT 1: DEBOUNCE SEARCH TERM
    // Tự động đếm ngược, nếu ngừng gõ đủ thời gian mới cập nhật debouncedSearch
    // ─────────────────────────────────────────────
    useEffect(() => {
        // Thiết lập thời gian chờ (1000ms = 1 giây. Bạn có thể đổi thành 2000 nếu muốn tròn 2s)
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(0); // Reset về trang 1 mỗi khi từ khóa tìm kiếm thực sự thay đổi
        }, 1000);

        // Hủy bộ đếm thời gian cũ nếu người dùng vẫn tiếp tục gõ chữ tiếp theo
        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    // ─────────────────────────────────────────────
    // EFFECT 2: FETCH DATA FROM SERVER
    // Lắng nghe theo `debouncedSearch` thay vì `searchTerm` cũ
    // ─────────────────────────────────────────────
    useEffect(() => {
        fetchUsers();
    }, [page, statusFilter, debouncedSearch]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = {
                page,
                size,
                search: debouncedSearch // Sử dụng giá trị đã qua xử lý debounce
            };

            if (statusFilter !== '') {
                params.active = statusFilter === 'true';
            }

            const res = await userAdminService.getUsers(params);
            const result = res.data?.result;

            setUsers(result?.content || []);
            setTotalPages(result?.totalPages || 0);
        } catch (error) {
            console.error(error);
            toast.error('Không tải được danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    // Đóng dropdown hành động khi click ra ngoài
    useEffect(() => {
        const handleOutsideClick = () => setActiveDropdown(null);
        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, []);

    // ─────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────
    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            const nextStatus = !currentStatus;
            const response = await userAdminService.updateUserStatus(userId, nextStatus);
            toast.success(nextStatus ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản');
            fetchUsers();
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                'Thay đổi trạng thái thất bại'
            );
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-0 md:p-6 text-[#1C2434] font-satoshi">
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Breadcrumb Header */}
            <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h2 className="text-xl font-bold text-[#1C2434]">Quản lý người dùng</h2>
                </div>
                <p className="text-xs text-[#64748B]">Home &gt; Quản lý người dùng</p>
            </div>

            {/* Main Content Box */}
            <div style={{ borderRadius: '1rem' }} className="bg-white  border border-[#E2E8F0]">

                {/* ── 1. HEADER SECTION ── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-2 border-b border-[#E2E8F0]">
                    <div>
                        <h2 className="text-lg text-start font-bold text-[#1C2434]">Danh sách người dùng</h2>
                    </div>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button onClick={fetchUsers} className="flex items-center justify-center gap-1.5 bg-white border border-[#E2E8F0] text-[#1C2434] px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[#F8FAFC] transition-all">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Tải lại
                        </button>
                        <button
                            onClick={() => navigate('/admin/users/create')}
                            className="flex items-center justify-center gap-1.5 bg-[#3C50E0] text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-opacity-90 transition-all  w-full sm:w-auto"
                        >

                            Thêm người dùng
                        </button>
                    </div>
                </div>

                {/* ── 2. FILTER BAR ── */}
                <div className="p-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col md:flex-row justify-between items-center gap-3">
                    {/* Search Input */}
                    <div className="relative w-full md:w-72">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                            <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            className="w-full bg-white border border-[#E2E8F0] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#1C2434] placeholder-[#8A99AD] focus:outline-none focus:border-[#3C50E0] transition-all"
                            placeholder="Tìm theo tên hoặc email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)} // Gõ mượt mà, không bị khựng dữ liệu
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <select
                            className="bg-white border border-[#E2E8F0] rounded-md px-2 py-1.5 text-xs text-[#1C2434] focus:outline-none focus:border-[#3C50E0] transition-all min-w-[180px]"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(0);
                            }}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="true">Đang hoạt động</option>
                            <option value="false">Đang bị khóa</option>
                        </select>
                    </div>
                </div>

                {/* ── 3. TABLE DATA SECTION ── */}
                {loading ? (
                    <div className="p-10 text-center text-[#64748B] font-medium text-xs">
                        <div className="animate-spin inline-block w-5 h-5 border-[2.5px] border-current border-t-transparent text-[#3C50E0] rounded-full mr-2" role="status"></div>
                        Loading users...
                    </div>
                ) : (
                    <>
                        <div className="max-w-full overflow-x-auto no-scrollbar">
                            <table className="w-full table-auto text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#E2E8F0] bg-[#F7F9FC] text-xs font-semibold text-[#64748B]">
                                        <th className="py-2.5 pl-4 w-10">
                                            <input type="checkbox" className="rounded border-[#D2D6DC] text-[#3C50E0] focus:ring-[#3C50E0] w-3.5 h-3.5 cursor-pointer" />
                                        </th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Người dùng</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Thông tin liên hệ</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Vai trò</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold">Trạng thái</th>
                                        <th className="p-2.5 uppercase tracking-wider font-bold text-right pr-4">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-[#E2E8F0]">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-[#F8FAFC] transition-colors">
                                            <td className="p-2.5 pl-4">
                                                <input type="checkbox" className="rounded border-[#D2D6DC] text-[#3C50E0] focus:ring-[#3C50E0] w-3.5 h-3.5 cursor-pointer" />
                                            </td>
                                            <td className="p-2.5 max-w-[280px]">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-9 h-9 rounded-full bg-[#E2E8F0] p-0.5 flex-shrink-0 flex items-center justify-center font-bold text-[#3C50E0] border border-[#CBD5E1]">
                                                        <img src={LogoInfo} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="font-semibold text-xs text-[#1C2434] truncate">{user.username || 'No Name'}</p>
                                                        <p className="text-[10px] text-[#64748B] mt-0.5 truncate">ID: {user.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-2.5 text-[#64748B] font-medium">
                                                <div>{user.email}</div>
                                                <div className="text-[10px] text-[#8A99AD] mt-0.5">{user.phone || 'N/A'}</div>
                                            </td>
                                            <td className="p-2.5">
                                                <div className="flex flex-wrap gap-1 max-w-[180px]">
                                                    {user.roles && user.roles.length > 0 ? (
                                                        user.roles.map((role, idx) => (
                                                            <span key={idx} className="inline-flex px-1.5 py-0.5 rounded bg-[#EBF0FF] text-[#3C50E0] font-semibold text-[10px] uppercase">
                                                                {role.name || role}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-400 text-[10px]">No Role</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-2.5">
                                                {user.active ? (
                                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-600 border border-green-100">Hoạt động</span>
                                                ) : (
                                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600 border border-red-100">Bị khóa</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td
                                                className="p-2.5 relative flex justify-center items-center"
                                                style={{ zIndex: activeDropdown === user.id ? 9999 : 'auto' }}
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdown(activeDropdown === user.id ? null : user.id);
                                                    }}
                                                    className="text-[#64748B] hover:text-[#1C2434] p-1 rounded-full hover:bg-[#F1F5F9] transition-colors flex items-center justify-center"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                </button>

                                                {activeDropdown === user.id && (
                                                    <div
                                                        /* SỬA: Thay "right-1/2 translate-x-1/2" bằng "right-2" để dropdown ép sát vào lề phải ô Action, không bị thò ra ngoài màn hình */
                                                        className={`absolute right-4 top-[80%] w-32 bg-white border border-[#E2E8F0] rounded shadow-xl py-1 z-[100] text-left token-dropdown`}
                                                    >
                                                        <button onClick={() => navigate(`/admin/users/detail/${user.id}`)} className="w-full text-start px-3 py-1.5 text-xs text-[#1C2434] hover:bg-[#F8FAFC] transition-colors">Chi tiết</button>
                                                        <button
                                                            onClick={() => openRoleModal(user)}
                                                            className="w-full text-start px-3 py-1.5 text-xs hover:bg-gray-50"
                                                        >
                                                            Đổi quyền
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleStatus(user.id, user.active)}
                                                            className={`w-full text-start px-3 py-1.5 text-xs font-medium transition-colors ${user.active ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                                                        >
                                                            {user.active ? 'Khóa tài khoản' : 'Mở tài khoản'}
                                                        </button>
                                                        <button
                                                            onClick={() => openResetPasswordModal(user)}
                                                            className="w-full text-start px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                                                        >
                                                            Reset mật khẩu
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Bar */}
                        <div className="flex justify-between items-center px-4 py-3 border-t border-[#E2E8F0] bg-white relative z-10">
                            <span className="text-xs text-[#64748B]">Trang {page + 1}/{totalPages || 1}</span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    className="px-2.5 py-1 text-[11px] font-medium border border-[#E2E8F0] rounded text-[#1C2434] bg-white hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    disabled={page === 0}
                                    onClick={() => setPage(prev => prev - 1)}
                                >
                                    Trước
                                </button>
                                <button
                                    className="px-2.5 py-1 text-[11px] font-medium border border-[#E2E8F0] rounded text-[#1C2434] bg-white hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    disabled={page + 1 >= totalPages}
                                    onClick={() => setPage(prev => prev + 1)}
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {
                showRoleModal && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[99999]">
                        <div className="bg-white rounded-xl w-[420px] p-6 shadow-xl">
                            <h3 className="text-lg font-bold mb-4">
                                Cập nhật quyền
                            </h3>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm text-gray-500">
                                        Người dùng
                                    </label>

                                    <div className="font-medium">
                                        {selectedUser?.username}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-500">
                                        Vai trò
                                    </label>

                                    <select
                                        value={selectedRole}
                                        onChange={(e) =>
                                            setSelectedRole(e.target.value)
                                        }
                                        className="w-full mt-1 border rounded-lg p-2"
                                    >
                                        <option value="USER">USER</option>
                                        <option value="PHARMACIST">PHARMACIST</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => setShowRoleModal(false)}
                                    className="px-4 py-2 border rounded-lg"
                                >
                                    Hủy
                                </button>

                                <button
                                    onClick={handleUpdateRole}
                                    className="px-4 py-2 bg-[#3C50E0] text-white rounded-lg"
                                >
                                    Lưu
                                </button>
                            </div>
                        </div>
                    </div>
                )
            };
            {
                showResetPasswordModal && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[99999]">
                        <div className="bg-white rounded-xl w-[420px] p-6 shadow-xl">
                            <h3 className="text-lg font-bold mb-4">
                                Reset mật khẩu
                            </h3>

                            <p className="text-sm text-gray-500 mb-4">
                                Người dùng:
                                <span className="font-medium ml-1">
                                    {selectedUser?.username}
                                </span>
                            </p>

                            <input
                                type="password"
                                placeholder="Nhập mật khẩu mới"
                                value={newPassword}
                                onChange={(e) =>
                                    setNewPassword(e.target.value)
                                }
                                className="w-full border rounded-lg p-2"
                            />

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() =>
                                        setShowResetPasswordModal(false)
                                    }
                                    className="px-4 py-2 border rounded-lg"
                                >
                                    Hủy
                                </button>

                                <button
                                    onClick={handleSubmitResetPassword}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg"
                                >
                                    Xác nhận
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default AdminUserPage;