import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import userAdminService from '../service/userAdminService'; // Đảm bảo đường dẫn này đúng với dự án của bạn
import BackButton from '../../components/Common/BackButton';

const CreateUserPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Khởi tạo state khớp 100% với các trường trong AdminCreateUserRequest DTO
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        sex: 'MALE', // Giá trị mặc định
        dob: '',
        password: '',
        role: 'USER', // Giá trị mặc định tương ứng với PredefinedRole
        active: true
    });

    // Handler xử lý thay đổi giá trị input chung
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handler gửi dữ liệu lên Server
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate cơ bản ở Client trước khi gửi
        if (formData.username.length < 3) {
            toast.error('Tên tài khoản phải có ít nhất 3 ký tự');
            return;
        }
        if (formData.password.length < 6 || formData.password.length > 10) {
            toast.error('Mật khẩu phải từ 6 đến 10 ký tự');
            return;
        }

        try {
            setLoading(false);
            setLoading(true);

            // Gọi API lưu người dùng từ service admin của bạn
            await userAdminService.createUser(formData);

            toast.success('Thêm người dùng mới thành công!');
            navigate('/admin/users'); // Quay về trang danh sách
        } catch (error) {
            console.error(error);
            // Hiển thị thông báo lỗi chi tiết từ backend trả về nếu có
            const serverMessage = error.response?.data?.message;
            toast.error(serverMessage || 'Thêm người dùng thất bại. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-6 text-[#1C2434] font-satoshi">
            {/* Breadcrumb Header */}
            <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h2 className="text-xl font-bold text-[#1C2434]">Quản lý người dùng</h2>
                </div>
                <BackButton to="/admin/users" />
            </div>

            {/* Main Form Block */}
            <div style={{ borderRadius: '1rem' }} className="bg-white border border-[#E2E8F0] max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="p-4 border-b border-[#E2E8F0]">
                    <h2 className="text-lg font-bold text-[#1C2434] text-start">Tạo người dùng mới</h2>
                    <p className="text-xs text-[#64748B] text-start mt-1">Điền đầy đủ thông tin bên dưới để tạo tài khoản hệ thống.</p>
                </div>

                {/* Form Section */}
                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Username */}
                        <div className="flex flex-col gap-1.5 items-start">
                            <label className="font-semibold text-[#1C2434]">Tên tài khoản <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="username"
                                required
                                placeholder="Nhập tên tài khoản (tối thiểu 3 ký tự)..."
                                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-[#1C2434] placeholder-[#8A99AD] focus:outline-none focus:border-[#3C50E0] transition-all"
                                value={formData.username}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-1.5 items-start">
                            <label className="font-semibold text-[#1C2434]">Địa chỉ Email <span className="text-red-500">*</span></label>
                            <input
                                type="email"
                                name="email"
                                required
                                placeholder="example@gmail.com..."
                                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-[#1C2434] placeholder-[#8A99AD] focus:outline-none focus:border-[#3C50E0] transition-all"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-1.5 items-start">
                            <label className="font-semibold text-[#1C2434]">Mật khẩu <span className="text-red-500">*</span></label>
                            <input
                                type="password"
                                name="password"
                                required
                                placeholder="Nhập mật khẩu (6 - 10 ký tự)..."
                                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-[#1C2434] placeholder-[#8A99AD] focus:outline-none focus:border-[#3C50E0] transition-all"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Phone */}
                        <div className="flex flex-col gap-1.5 items-start">
                            <label className="font-semibold text-[#1C2434]">Số điện thoại</label>
                            <input
                                type="text"
                                name="phone"
                                placeholder="Nhập số điện thoại..."
                                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-[#1C2434] placeholder-[#8A99AD] focus:outline-none focus:border-[#3C50E0] transition-all"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Date of Birth (dob) */}
                        <div className="flex flex-col gap-1.5 items-start">
                            <label className="font-semibold text-[#1C2434]">Ngày sinh</label>
                            <input
                                type="date"
                                name="dob"
                                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-[#1C2434] focus:outline-none focus:border-[#3C50E0] transition-all"
                                value={formData.dob}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Sex (Giới tính) */}
                        <div className="flex flex-col gap-1.5 items-start">
                            <label className="font-semibold text-[#1C2434]">Giới tính</label>
                            <select
                                name="sex"
                                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-[#1C2434] focus:outline-none focus:border-[#3C50E0] transition-all"
                                value={formData.sex}
                                onChange={handleChange}
                            >
                                <option value="MALE">Nam</option>
                                <option value="FEMALE">Nữ</option>
                                <option value="OTHER">Khác</option>
                            </select>
                        </div>

                        {/* Role (Vai trò) */}
                        <div className="flex flex-col gap-1.5 items-start">
                            <label className="font-semibold text-[#1C2434]">Vai trò hệ thống</label>
                            <select
                                name="role"
                                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-[#1C2434] focus:outline-none focus:border-[#3C50E0] transition-all"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="USER">User (Khách hàng)</option>
                                <option value="ADMIN">Admin (Quản trị viên)</option>
                                <option value="PHARMACIST">Pharmacist (Dược sỹ)</option>
                            </select>
                        </div>

                        {/* Active status */}
                        <div className="flex flex-col gap-1.5 items-start justify-center pt-2">
                            <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#1C2434]">
                                <input
                                    type="checkbox"
                                    name="active"
                                    className="rounded border-[#D2D6DC] text-[#3C50E0] focus:ring-[#3C50E0] w-4 h-4 cursor-pointer"
                                    checked={formData.active}
                                    onChange={handleChange}
                                />
                                Kích hoạt tài khoản ngay khi tạo
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons Footer */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0] mt-4">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => navigate('/admin/users')}
                            className="bg-white border border-[#E2E8F0] text-[#1C2434] px-4 py-2 rounded-md font-medium hover:bg-[#F8FAFC] disabled:opacity-50 transition-all"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#3C50E0] text-white px-5 py-2 rounded-md font-medium hover:bg-opacity-90 disabled:opacity-50 transition-all  flex items-center gap-2"
                        >
                            {loading && (
                                <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></div>
                            )}
                            Lưu thông tin
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUserPage;