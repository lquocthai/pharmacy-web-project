import axiosClient from '../configs/axiosConfig.js';

/**
 * Tất cả endpoints khớp với CartController backend:
 *
 * GET    /carts                        → ApiResponse<CartResponse>
 * POST   /carts/items                  body: { productId, quantity }  → ApiResponse<CartResponse>
 * PUT    /carts/items/:itemId          body: { quantity }             → ApiResponse<CartResponse>
 * DELETE /carts/items/:itemId                                         → ApiResponse<CartResponse>
 * DELETE /carts                                                       → ApiResponse<Void>
 * PATCH  /carts/items/:itemId/increase                               → ApiResponse<CartResponse>
 * PATCH  /carts/items/:itemId/decrease                               → ApiResponse<CartResponse>
 *
 * CartResponse: { id, items: CartItemResponse[], totalItems, totalQuantity }
 * CartItemResponse: { id, productId, productName, productSlug, unit,
 *                     price, priceAtTime, quantity, subtotal, imageUrl, stockQuantity }
 */
const cartService = {
    // Lấy giỏ hàng của user hiện tại
    getCart: () =>
        axiosClient.get('/carts'),

    // Thêm sản phẩm vào giỏ (nếu đã có → cộng thêm quantity)
    addItem: ({ productId, quantity }) =>
        axiosClient.post('/carts/items', { productId, quantity }),

    // Cập nhật số lượng cụ thể cho 1 item
    updateItem: (itemId, quantity) =>
        axiosClient.put(`/carts/items/${itemId}`, { quantity }),

    // Xóa 1 sản phẩm khỏi giỏ
    removeItem: (itemId) =>
        axiosClient.delete(`/carts/items/${itemId}`),

    // Xóa toàn bộ giỏ hàng
    clearCart: () =>
        axiosClient.delete('/carts'),

    // Tăng số lượng thêm 1
    increaseItem: (itemId) =>
        axiosClient.patch(`/carts/items/${itemId}/increase`),

    // Giảm số lượng đi 1 (nếu về 0 → backend throw lỗi)
    decreaseItem: (itemId) =>
        axiosClient.patch(`/carts/items/${itemId}/decrease`),
};

export default cartService;
