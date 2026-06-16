import axiosClient from '../../configs/axiosConfig.js';

const categoryAdminService = {

    // Lấy chi tiết category theo id (admin)
    getById: (id) => {
        return axiosClient.get(`/categories/admin/${id}`);
    },

    // Tạo category cha + children
    createParentWithChildren: (data) => {
        return axiosClient.post('/categories/admin', data);
    },

    // Update category cha + children
    updateCategory: (id, data) => {
        return axiosClient.put(`/categories/admin/${id}`, data);
    },

    // Xóa category
    deleteCategory: (id) => {
        return axiosClient.delete(`/categories/admin/${id}`);
    },
};

export default categoryAdminService;