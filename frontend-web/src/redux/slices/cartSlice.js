import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cartService from '../../services/cartService';

// ── Async thunk: gọi GET /carts và lưu vào Redux ──────────────────────────────
export const fetchCart = createAsyncThunk(
    'cart/fetchCart',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await cartService.getCart();
            // Backend trả ApiResponse<CartResponse> — code 0 là thành công
            if (data.code !== 0) return rejectWithValue(data.message);
            return data.result; // CartResponse
        } catch (error) {
            // Nếu 404 (chưa có giỏ) → trả về giỏ rỗng, không báo lỗi
            if (error.response?.status === 404) {
                return { id: null, items: [], totalItems: 0, totalQuantity: 0 };
            }
            return rejectWithValue(error.response?.data?.message || 'Lỗi tải giỏ hàng');
        }
    }
);

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        id: null,
        items: [],          // CartItemResponse[]
        totalItems: 0,      // số loại sản phẩm
        totalQuantity: 0,   // tổng số lượng
        loading: false,
        error: null,
    },
    reducers: {
        // Cập nhật toàn bộ giỏ từ response API (dùng sau add/update/remove/increase/decrease)
        setCart: (state, action) => {
            const cart = action.payload; // CartResponse
            state.id = cart.id;
            state.items = cart.items ?? [];
            // Nếu trong payload có totalItems và totalQuantity (Từ API trả về) -> Lấy luôn
            // Nếu KHÔNG CÓ (Từ Optimistic Update gửi lên) -> Tự tính toán dựa trên mảng items mới để UI không bị về 0
            state.totalItems = cart.totalItems !== undefined
                ? cart.totalItems
                : (cart.items ? cart.items.length : state.totalItems);

            state.totalQuantity = cart.totalQuantity !== undefined
                ? cart.totalQuantity
                : (cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : state.totalQuantity);
            state.error = null;
        },

        // Xóa sạch giỏ hàng khi logout
        clearCart: (state) => {
            state.id = null;
            state.items = [];
            state.totalItems = 0;
            state.totalQuantity = 0;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCart.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.loading = false;
                state.id = action.payload.id;
                state.items = action.payload.items ?? [];
                state.totalItems = action.payload.totalItems ?? 0;
                state.totalQuantity = action.payload.totalQuantity ?? 0;
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { setCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
