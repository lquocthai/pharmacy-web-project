import axiosClient from '../configs/axiosConfig.js';

const prescriptionService = {
    createPrescription: (formData) =>
        axiosClient.post('/prescriptions', formData),

    getMyPrescriptions: (status) =>
        axiosClient.get('/prescriptions/my', {
            params: status ? { status } : {},
        }),
    getPrescriptionById: (id) => {
        return axiosClient.get(`/prescriptions/${id}`);
    },
};

export default prescriptionService;