import axiosClient from '../configs/axiosConfig.js';

const fileService = {
    /**
     * Upload một file ảnh lên Cloudinary qua backend.
     * @param {File} file
     * @returns {Promise<string>} URL của ảnh đã upload
     */
    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosClient.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data?.result?.url;
    },

    /**
     * Upload nhiều file ảnh cùng lúc lên Cloudinary qua backend.
     * Trả về mảng URL theo đúng thứ tự file truyền vào.
     * @param {File[]} files
     * @returns {Promise<string[]>} Mảng URL
     */
    uploadFiles: async (files) => {
        if (!files || files.length === 0) return [];
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        const response = await axiosClient.post('/files/upload/batch', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data?.result || [];
    }
};

export default fileService;
