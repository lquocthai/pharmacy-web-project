import axiosClient from '../../configs/axiosConfig.js';

const dashboardPharmacistService = {
    getDashboard: () => axiosClient.get('/pharmacist/dashboard'),
};

export default dashboardPharmacistService;
