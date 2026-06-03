import axiosClient from '../../configs/axiosConfig.js';

const orderAdminService = {
    getOrders: (params) =>
        axiosClient.get('/admin/orders', { params }),
    getOrderById: (id) =>
        axiosClient.get(`/admin/orders/${id}`),
    updateStatus(orderId, data) {
        return axiosClient.patch(`/admin/orders/${orderId}/status`, data);
    },
    cancelOrder(orderId, data) {
        return axiosClient.patch(`/admin/orders/${orderId}/cancel`, data);
    }
};

export default orderAdminService;