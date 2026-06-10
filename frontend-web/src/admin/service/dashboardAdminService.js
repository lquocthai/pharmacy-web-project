import axiosClient from '../../configs/axiosConfig.js';

const dashboardAdminService = {
    getDashboard: () => axiosClient.get('/admin/dashboard'),
};

export default dashboardAdminService;
