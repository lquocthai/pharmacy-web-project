import axiosClient from '../../configs/axiosConfig.js';

const userAdminService = {
    getUsers: (params) =>
        axiosClient.get('/admin/users', { params }),

    getUserById: (id) =>
        axiosClient.get(`/admin/users/${id}`),

    createUser: (data) =>
        axiosClient.post('/admin/users', data),

    updateUser: (id, role) =>
        axiosClient.put(`/admin/users/${id}/role`, {
            role
        }),

    updateUserStatus: (id, active) =>
        axiosClient.patch(
            `/admin/users/${id}/status`,
            { active }
        ),

    resetPassword: (id, password) =>
        axiosClient.patch(`/admin/users/${id}/reset-password`, { password }),
};

export default userAdminService;