import axiosClient from '../../configs/axiosConfig.js';

const orderAdminService = {
    getOrders: (params) =>
        axiosClient.get('/admin/orders', { params }),
    getOrderByCode: (orderCode) =>
        axiosClient.get(`/admin/orders/${orderCode}`),
    updateStatus(orderId, data) {
        return axiosClient.patch(`/admin/orders/${orderId}/status`, data);
    },
    cancelOrder(orderId, data) {
        return axiosClient.patch(`/admin/orders/${orderId}/cancel`, data);
    }
};

export default orderAdminService;