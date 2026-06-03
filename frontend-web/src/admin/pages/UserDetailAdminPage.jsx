import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import userAdminService from '../service/userAdminService';
import LogoInfo from '../../assets/avatar-profile.svg';

const UserDetailAdminPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserDetail = async () => {
            try {
                setLoading(true);
                const res = await userAdminService.getUserById(id);
                // Khớp với cấu trúc response: res.data.result
                setUser(res.data?.result || null);
            } catch (error) {
                console.error(error);
                toast.error('Không thể tải thông tin chi tiết người dùng');
                navigate('/admin/users'); // Quay lại trang danh sách nếu lỗi
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchUserDetail();
        }
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center text-[#64748B] font-medium text-xs">
                <div className="animate-spin inline-block w-5 h-5 border-[2.5px] border-current border-t-transparent text-[#3C50E0] rounded-full mr-2" role="status"></div>
                Đang tải thông tin người dùng...
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#F1F5F9] p-6 text-center text-[#64748B]">
                Không tìm thấy dữ liệu người dùng.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-6 text-[#1C2434] font-satoshi">

            {/* Breadcrumb Header */}
            <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h2 className="text-xl font-bold text-[#1C2434]">Chi tiết người dùng</h2>
                </div>
                <p className="text-xs text-[#64748B]">
                    Home &gt; Quản lý người dùng &gt; Chi tiết
                </p>
            </div>



            {/* Bố cục Grid chính */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── CỘT TRÁI: TÓM TẮT & TRẠNG THÁI (1 Part) ── */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Thẻ Avatar & Trạng thái */}
                    <div style={{ borderRadius: '1rem' }} className="bg-white p-6  border border-[#E2E8F0] text-center">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#E2E8F0] p-1 flex items-center justify-center font-bold text-[#3C50E0] border border-[#CBD5E1]">
                            <img src={LogoInfo} alt={user.username} className="w-full h-full rounded-full object-cover" />
                        </div>
                        <h3 className="text-base font-bold text-[#1C2434] truncate">{user.username || 'N/A'}</h3>
                        <p className="text-xs text-[#64748B] mt-1 truncate">{user.email}</p>

                        <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex flex-col items-center gap-2">
                            <span className="text-[11px] text-[#8A99AD] font-medium uppercase tracking-wider">Trạng thái tài khoản</span>
                            {user.active ? (
                                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-100">
                                    Hoạt động
                                </span>
                            ) : (
                                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
                                    Bị khóa
                                </span>
                            )}
                        </div>
                        <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex flex-col items-center gap-2">
                            <span className="text-[11px] text-[#8A99AD] font-medium uppercase tracking-wider">Vai trò tài khoản</span>
                            {user.roles && user.roles.length > 0 ? (
                                user.roles.map((role, idx) => (
                                    <span key={idx} className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-100">
                                        {role.name}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-gray-400 italic">Chưa được cấp vai trò</span>
                            )}
                        </div>
                    </div>


                </div>

                {/* ── CỘT PHẢI: CHI TIẾT & SỔ ĐỊA CHỈ (2 Parts) ── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Phần 1: Thông tin cá nhân cơ bản */}
                    <div style={{ borderRadius: '1rem' }} className="mb-2 bg-white  border border-[#E2E8F0] overflow-hidden">
                        <div className="p-2 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                            <h6 className="text-start text-sm font-bold text-[#1C2434] uppercase tracking-wider">Thông tin cá nhân</h6>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                                <label className="block text-[#64748B] font-medium mb-1">Mã định danh (ID)</label>
                                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded text-[#1C2434] font-mono select-all">
                                    {user.id}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[#64748B] font-medium mb-1">Tên tài khoản / Họ tên</label>
                                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded text-[#1C2434] font-semibold">
                                    {user.username || 'Chưa cập nhật'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[#64748B] font-medium mb-1">Địa chỉ Email</label>
                                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded text-[#1C2434]">
                                    {user.email || 'Chưa cập nhật'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[#64748B] font-medium mb-1">Số điện thoại</label>
                                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded text-[#1C2434]">
                                    {user.phone || <span className="text-gray-400 italic">Chưa cập nhật</span>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[#64748B] font-medium mb-1">Giới tính</label>
                                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded text-[#1C2434]">
                                    {user.sex || <span className="text-gray-400 italic">Chưa cập nhật</span>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[#64748B] font-medium mb-1">Ngày sinh (DOB)</label>
                                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded text-[#1C2434]">
                                    {user.dob || <span className="text-gray-400 italic">Chưa cập nhật</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Phần 2: Danh sách Sổ Địa Chỉ */}
                    <div style={{ borderRadius: '1rem' }} className="bg-white  border border-[#E2E8F0] overflow-hidden">
                        <div className="p-2 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
                            <h6 className="text-sm font-bold text-[#1C2434] uppercase tracking-wider">Danh sách sổ địa chỉ</h6>
                            <span className="bg-[#E2E8F0] text-[#1C2434] font-bold text-xs px-2.5 py-0.5 rounded-full">
                                {user.addresses ? user.addresses.length : 0}
                            </span>
                        </div>

                        <div className="p-3 space-y-4 text-start">
                            {user.addresses && user.addresses.length > 0 ? (
                                user.addresses.map((addr) => (
                                    <div
                                        key={addr.id}
                                        className={`p-3 border rounded-xl relative transition-all ${addr.defaultAddress
                                            ? 'border-[#3C50E0] bg-[#F4F6FF]'
                                            : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                                            }`}
                                    >
                                        {/* Nhãn Tag phân loại (HOME, WORK, v.v...) */}
                                        <div className="absolute top-4 right-4 flex items-center gap-2">
                                            {addr.label && (
                                                <span className="px-2 py-0.5 text-[9px] font-bold bg-[#E2E8F0] text-[#1C2434] rounded uppercase">
                                                    {addr.label}
                                                </span>
                                            )}
                                            {addr.defaultAddress && (
                                                <span className="px-2 py-0.5 text-[9px] font-bold bg-green-100 text-green-700 rounded uppercase border border-green-200">
                                                    Mặc định
                                                </span>
                                            )}
                                        </div>

                                        {/* Chi tiết địa chỉ */}
                                        <div className="space-y-1.5 text-xs pr-20">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-[#1C2434] text-sm">{addr.fullName}</span>
                                                <span className="text-[#64748B]">|</span>
                                                <span className="text-[#64748B] font-medium">{addr.phone}</span>
                                            </div>

                                            <div className="text-[#1C2434] mt-1.5 leading-relaxed">
                                                <p><span className="text-[#64748B] font-medium">Địa chỉ cụ thể:</span> {addr.addressDetail}</p>
                                                <p className="text-[#64748B] mt-0.5">
                                                    {addr.ward}, {addr.district}, {addr.province}
                                                </p>
                                            </div>

                                            {/* ID hệ thống của địa chỉ ẩn hoặc phục vụ đối soát */}
                                            <div className="pt-2 text-[10px] text-gray-400 font-mono flex gap-4">
                                                <span>Address ID: {addr.id}</span>
                                                <span>Codes: P-{addr.provinceId} / D-{addr.districtId} / W-{addr.wardCode}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-gray-400 italic text-xs">
                                    Người dùng này chưa đăng ký địa chỉ nào.
                                </div>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default UserDetailAdminPage;