import axiosClient from '../configs/axiosConfig.js';

/**
 * GET  /ratings/product/:productId?star=&page=&size=
 *   → ApiResponse<PageResponse<RatingResponse>>
 *   RatingResponse: { id, userId, username, star, comment, createdAt, updatedAt,
 *                     replies: [{ id, repliedById, repliedByUsername, content, createdAt }] }
 *
 * POST /ratings
 *   body: { productId, star, comment }
 *   → ApiResponse<RatingResponse>
 *
 * PUT  /ratings/:ratingId
 *   body: { star, comment }
 *   → ApiResponse<RatingResponse>
 *
 * DELETE /ratings/:ratingId
 *   → ApiResponse<Void>
 *
 * POST /ratings/:ratingId/replies
 *   body: { content }
 *   → ApiResponse<RatingResponse>
 */
const ratingService = {
    // Lấy danh sách đánh giá — public, hỗ trợ lọc theo sao
    getByProduct: (productId, { star = null, page = 0, size = 10 } = {}) =>
        axiosClient.get(`/ratings/product/${productId}`, {
            params: {
                ...(star !== null && { star }),
                page,
                size,
            },
        }),

    // Tạo đánh giá mới — cần đăng nhập
    create: ({ productId, star, comment }) =>
        axiosClient.post('/ratings', { productId, star, comment }),

    // Sửa đánh giá — chỉ chủ sở hữu
    update: (ratingId, { star, comment }) =>
        axiosClient.put(`/ratings/${ratingId}`, { star, comment }),

    // Xóa đánh giá — chỉ chủ sở hữu
    delete: (ratingId) =>
        axiosClient.delete(`/ratings/${ratingId}`),

    // Dược sĩ trả lời đánh giá
    reply: (ratingId, content) =>
        axiosClient.post(`/ratings/${ratingId}/replies`, { content }),
};

export default ratingService;
