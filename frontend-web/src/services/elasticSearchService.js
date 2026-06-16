import axiosClient from '../configs/axiosConfig.js';

const elasticSearchService = {
    /**
     * API lấy danh sách gợi ý từ khóa (Auto-complete / Suggestion)
     * @param {string} keyword - Từ khóa người dùng đang gõ (ví dụ: 'vit')
     * @param {number} size - Số lượng kết quả tối đa muốn lấy (mặc định 5)
     */
    getSuggestions: (keyword, size = 5) => {
        const url = '/search/suggestions';
        return axiosClient.get(url, {
            params: {
                keyword: keyword,
                size: size
            }
        });
    },

    /**
     * API Tìm kiếm sản phẩm full-text search (Phân trang)
     * @param {string} keyword - Từ khóa tìm kiếm (ví dụ: 'vitamin c')
     * @param {number} page - Số trang hiện tại (bắt đầu từ 0)
     * @param {number} size - Số lượng sản phẩm trên 1 trang (mặc định 20)
     */
    searchProducts: (keyword, page = 0, size = 20) => {
        const url = '/search/products';
        return axiosClient.get(url, {
            params: {
                keyword: keyword,
                page: page,
                size: size
            }
        });
    }
};

export default elasticSearchService;