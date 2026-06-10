import axiosClient from '../configs/axiosConfig.js';

/**
 * Service cho trang HomePage
 * Tập hợp các API call cần thiết để render homepage
 */
const homeService = {
    /**
     * Lấy danh sách sản phẩm bán chạy
     * GET /products?page=0&size=8&sortBy=sold&sortDir=desc
     */
    getBestSellers: (page = 0, size = 8) =>
        axiosClient.get('/products', {
            params: { page, size, sortBy: 'name', sortDir: 'asc' },
        }),

    /**
     * Lấy toàn bộ danh mục để render category grid
     * GET /categories
     */
    getCategories: () =>
        axiosClient.get('/categories'),
};

export default homeService;
