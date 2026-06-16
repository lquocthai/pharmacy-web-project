import axiosClient from '../../configs/axiosConfig.js';

const ratingPharmacistService = {
    // Danh sách đánh giá có filter + phân trang
    /**
     * GET /pharmacist/ratings
     * Lấy danh sách đánh giá — chỉ PHARMACIST.
     *
     * @param status      lọc theo trạng thái (ACTIVE / HIDDEN), null = tất cả
     * @param star        lọc theo số sao (1-5), null = tất cả
     * @param productName lọc theo tên sản phẩm, null = tất cả
     * @param fromDate    lọc từ ngày (ISO date), null = không giới hạn
     * @param toDate      lọc đến ngày (ISO date), null = không giới hạn
     * @param page        trang hiện tại (mặc định 0)
     * @param size        số bản ghi mỗi trang (mặc định 10)
     */
    getRatings: (params = {}) =>
        axiosClient.get('/pharmacist/ratings', {
            params,
        }),

    // Chi tiết đánh giá
    /**
     * GET /pharmacist/ratings/{ratingId}
     * Lấy chi tiết một đánh giá — chỉ PHARMACIST.
     *
     * @param ratingId ID của đánh giá
     */
    getRatingDetail: (ratingId) =>
        axiosClient.get(`/pharmacist/ratings/${ratingId}`),

    // Trả lời đánh giá
    /**
     * POST /ratings/{ratingId}/replies
     * Dược sĩ trả lời đánh giá — cần đăng nhập (ROLE_PHARMACIST kiểm tra ở service hoặc @PreAuthorize).
     * data : content (nội dung trả lời, bắt buộc)
     */
    replyRating: (ratingId, data) =>
        axiosClient.post(
            `/pharmacist/ratings/${ratingId}/replies`,
            data
        ),

    updateRatingStatus: (ratingId, status) => {
        return axiosClient.patch(`/pharmacist/ratings/${ratingId}/status`, null, {
            params: { status }
        });
    }
};

export default ratingPharmacistService;