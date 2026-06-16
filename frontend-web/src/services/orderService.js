import axiosClient from '../configs/axiosConfig.js';

/**
 * Order Service
 *
 * Backend endpoints:
 *
 * POST   /orders
 * GET    /orders/my-orders
 * GET    /orders/{orderCode}
 * PATCH  /orders/{orderCode}/cancel
 */

const orderService = {

    /**
     * Tạo đơn hàng
     *
     * CreateOrderRequest:
     * {
     *    addressId,
     *    paymentMethod,
     *    shippingFee,
     *    totalAmount,
     *    note,
     *    items: [
     *      {
     *          variantId,
     *          quantity,
     *          imageUrl
     *      }
     *    ]
     * }
     */
    placeOrder: (payload) =>
        axiosClient.post(
            '/orders',
            payload
        ),

    /**
     * Lấy danh sách đơn hàng của user hiện tại
     *
     * Optional:
     * status=PENDING
     */
    getMyOrders: (status) =>
        axiosClient.get(
            '/orders',
            {
                params: status
                    ? { status }
                    : {}
            }
        ),
    // lấy order theo mã đơn hàng
    getOrderByCode: (orderCode) =>
        axiosClient.get(`/orders/code/${orderCode}`),

    /**
     * Lấy chi tiết đơn hàng
     */
    getOrderDetail: (orderCode) =>
        axiosClient.get(
            `/orders/${orderCode}`
        ),

    /**
     * Hủy đơn hàng
     */
    cancelOrder: (orderCode) =>
        axiosClient.patch(
            `/orders/${orderCode}/cancel`
        ),
};

export default orderService;