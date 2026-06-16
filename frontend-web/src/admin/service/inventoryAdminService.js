import axiosClient from '../../configs/axiosConfig.js';

const inventoryAdminService = {
    getDashboard: () =>
        axiosClient.get('/admin/inventory/dashboard'),

    getBatches: (params) =>
        axiosClient.get('/admin/inventory/batches', { params }),

    getBatchById: (id) =>
        axiosClient.get(`/admin/inventory/batches/${id}`),

    importStock: (data) =>
        axiosClient.post('/admin/inventory/import', data),

    updateBatch: (id, data) =>
        axiosClient.put(`/admin/inventory/batches/${id}`, data),

    getTransactions: (params) =>
        axiosClient.get('/admin/inventory/transactions', { params }),

    getLowStock: (params) =>
        axiosClient.get('/admin/inventory/low-stock', { params }),

    getExpiring: (params) =>
        axiosClient.get('/admin/inventory/expiring', { params }),

    getOutOfStock: (params) =>
        axiosClient.get('/admin/inventory/out-of-stock', { params }),
};

export default inventoryAdminService;
