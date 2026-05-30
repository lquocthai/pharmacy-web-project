import { createSlice } from '@reduxjs/toolkit';
import { jwtDecode } from "jwt-decode";

const savedUser = localStorage.getItem('user');

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        // Lấy dữ liệu từ localStorage để khi F5 trang web không bị mất trạng thái đăng nhập
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
        isAuthenticated: !!localStorage.getItem('accessToken'), // Chuyển thành boolean (true nếu có token)
        isLoginModalOpen: false,
        user: savedUser ? JSON.parse(savedUser) : null,
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
            const { accessToken, refreshToken, user } = action.payload;

            // // Decode token để lấy thông tin
            // const decoded = jwtDecode(accessToken);
            // const basicUser = {
            //     email: decoded.sub,
            //     username: decoded.username,
            //     roles: decoded.scope,

            // };

            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.user = user;
            state.isAuthenticated = true;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
        },
        // =========================
        // UPDATE FULL USER INFO
        // gọi sau khi GET /users/me
        // =========================
        setUserInfo: (state, action) => {
            state.user = {
                ...state.user,
                ...action.payload,
            };

            localStorage.setItem(
                'user',
                JSON.stringify(state.user)
            );
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

export const { openLoginModal, closeLoginModal, setLoginSuccess, setLogout, resetLogoutFlag, setUserInfo } = authSlice.actions;
export default authSlice.reducer;