import axiosClient from '../configs/axiosConfig.js';


const categoryService = {
    // Lấy danh mục sản phẩm
    getCategoriesTree: (slug) =>
        axiosClient.get(`/categories/${slug}/tree`),
};


export default categoryService;
