import { createSlice } from '@reduxjs/toolkit';
import { jwtDecode } from "jwt-decode";
const authSlice = createSlice({
    name: 'auth',
    initialState: {
        // Lấy dữ liệu từ localStorage để khi F5 trang web không bị mất trạng thái đăng nhập
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
        isAuthenticated: !!localStorage.getItem('accessToken'), // Chuyển thành boolean (true nếu có token)
        isLoginModalOpen: false,
        user: JSON.parse(localStorage.getItem('user')) || null, // Lưu cả info user để hiển thị tên/avatar
        isLoggingOut: false,  // ← thêm flag

    },
    reducers: {
        // Quản lý việc ẩn/hiện Modal đăng nhập
        openLoginModal: (state) => {
            state.isLoginModalOpen = true;
        },
        closeLoginModal: (state) => {
            state.isLoginModalOpen = false;
        },

        // Xử lý khi đăng nhập thành công (Google hoặc Email/Pass)
        setLoginSuccess: (state, action) => {
            const { accessToken, refreshToken } = action.payload;

            // Decode token để lấy thông tin
            const decoded = jwtDecode(accessToken);
            const user = {
                email: decoded.sub,
                username: decoded.username,
                roles: decoded.scope,

            };

            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.user = user;
            state.isAuthenticated = true;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
        },
        // Xử lý đăng xuất
        setLogout: (state) => {
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.user = null;

            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        },
        resetLogoutFlag(state) {
            state.isLoggingOut = false;  // ← reset sau khi redirect xong
        },

    },
});

export const { openLoginModal, closeLoginModal, setLoginSuccess, setLogout, resetLogoutFlag } = authSlice.actions;
export default authSlice.reducer;