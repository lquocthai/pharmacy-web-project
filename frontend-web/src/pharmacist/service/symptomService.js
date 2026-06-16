import axiosClient from '../../configs/axiosConfig.js';

const symptomService = {
    getSymptomsByProduct: (productId) => {
        return axiosClient.get(`pharmacist/symptoms/${productId}`);
    },
    addSymptoms: (productId, names) => {
        return axiosClient.post(`pharmacist/symptoms/add/${productId}`, { names });
    },
    editSymptoms: (productId, names) => {
        return axiosClient.put(`pharmacist/symptoms/edit/${productId}`, { names });
    }
}

export default symptomService;