import axiosClient from '../configs/axiosConfig.js';

/**
 * GET /products/{categorySlug}?page=&size=&sortBy=&sortDir=
 *   → ApiResponse<PageResponse<ProductSummaryResponse>>
 *
 * GET /products/detail/{slug}
 *   → ApiResponse<ProductDetailResponse>
 *   ProductDetailResponse: {
 *     id, name, slug, price, oldPrice, unit, isPrescription,
 *     manufacturer, country, categoryId, categoryName, categorySlug,
 *     images: [{ id, imageUrl, isPrimary }],
 *     detail: { usage, sideEffects, contraindications, storage, composition, description },
 *     stockQuantity,
 *     ratingSummary: { averageRating, totalRatings, ratingBreakdown: { 1:n, 2:n, ... } }
 *   }
 */
const productService = {
    // Lấy danh sách sản phẩm theo category slug (load more / phân trang)
    getByCategory: (
        categorySlug,
        page = 0,
        size = 20,
        sortBy = 'name',
        sortDir = 'asc'
    ) =>
        axiosClient.get('/products', {
            params: {
                categorySlug,
                page,
                size,
                sortBy,
                sortDir
            }
        }),

    // Lấy chi tiết sản phẩm theo slug
    getDetail: (slug) =>
        axiosClient.get(`/products/detail/${slug}`),
};

export default productService;
