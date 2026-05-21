import axiosClient from '../configs/axiosConfig.js';

/**
 * UserResponse: { id, username, email, dob, phone, sex, provider, roles,
 *                 addresses: UserAddressResponse[] }
 *
 * UserAddressResponse: { id, fullName, phone, province, district, ward,
 *                        addressDetail, isDefault, label, fullAddress }
 */
const profileService = {
    // Lấy thông tin user hiện tại (bao gồm danh sách địa chỉ)
    getMe: () => axiosClient.get('/users/me'),

    // Cập nhật thông tin cá nhân (username, dob, sex, phone)
    updateUser: (userId, data) => axiosClient.put(`/users/${userId}`, data),

    // ── Địa chỉ ──────────────────────────────────────────────────────────────

    // Lấy danh sách địa chỉ (default đứng đầu)
    getAddresses: () => axiosClient.get('/users/addresses'),

    // lấy địa chỉ default
    getDefaultAddress: () => axiosClient.get('/users/addresses/default'),

    // Thêm địa chỉ mới
    // body: { fullName, phone, province, district, ward, addressDetail, isDefault, label }
    createAddress: (data) => axiosClient.post('/users/addresses', data),

    // Sửa địa chỉ
    updateAddress: (id, data) => axiosClient.put(`/users/addresses/${id}`, data),

    // Xóa địa chỉ
    deleteAddress: (id) => axiosClient.delete(`/users/addresses/${id}`),

    // Đặt làm địa chỉ mặc định
    setDefaultAddress: (id) => axiosClient.patch(`/users/addresses/${id}/default`),
};

export default profileService;
