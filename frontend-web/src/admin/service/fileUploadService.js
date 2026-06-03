import axiosClient from '../../configs/axiosConfig.js';

const fileUploadService = {
    /**
     * Upload hình ảnh lên Cloudinary thông qua Backend server
     * @param {FormData} formData - Chứa file cần upload (formData.append('file', file))
     * @returns {Promise} - Trả về Promise chứa cấu trúc ApiResponse<FileUploadResponse>
     */
    uploadImage: (formData) => {
        return axiosClient.post('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

export default fileUploadService;