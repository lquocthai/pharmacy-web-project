import axiosClient from '../configs/axiosConfig.js';

/**
 * Payment Service
 *
 * Backend endpoints:
 *
 * POST /payments/vnpay/create
 * -> Tạo URL thanh toán VNPay
 *
 * Body:
 * {
 *    orderCode: string,
 *    amount: number
 * }
 *
 * Response:
 * ApiResponse<string>
 *
 * result = paymentUrl
 */

const paymentService = {

    /**
     * Khởi tạo giao dịch VNPay
     *
     * @param {Object} payload
     * @param {string} payload.orderCode - Mã đơn hàng
     * @param {number} payload.amount - Tổng tiền thanh toán
     *
     * @returns {Promise<ApiResponse<string>>}
     */
    createVnPayUrl: (payload) =>
        axiosClient.post(
            '/payments/vnpay/create',
            payload
        ),
};

export default paymentService;