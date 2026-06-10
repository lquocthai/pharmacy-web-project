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
    getAllProducts: (page = 0, size = 8, sortBy = 'createdAt', sortDir = 'desc') =>
        axiosClient.get('/products/all', {
            params: { page, size, sortBy, sortDir }
        }),
    // Lấy danh sách sản phẩm theo category slug (load more / phân trang)
    getByCategory: (
        categorySlug,
        page = 0,
        size = 20,
        sortBy = 'name',
        sortDir = 'asc',
        // BỔ SUNG CÁC BỘ LỌC MỚI VÀO ĐÂY
        manufacturer = null,
        country = null,
        minPrice = null,
        maxPrice = null
    ) =>
        axiosClient.get('/products', {
            params: {
                categorySlug,
                page,
                size,
                sortBy,
                sortDir,
                // ĐƯA CÁC BỘ LỌC MỚI VÀO PARAMS
                manufacturer,
                country,
                minPrice,
                maxPrice
            }
        }),

    // Lấy chi tiết sản phẩm theo slug
    getDetail: (slug) =>
        axiosClient.get(`/products/detail/${slug}`),
};

export default productService;
