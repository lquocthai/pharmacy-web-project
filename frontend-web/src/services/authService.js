
import axiosClient from '../configs/axiosConfig.js';

const authService = {
    /**
     * 1. Đăng ký người dùng mới & Gửi OTP
     * URL: POST http://localhost:8080/pharmacy/users/register
     */
    register: (data) => axiosClient.post('/users/register', data),

    /**
     * 2. Xác thực OTP để hoàn tất đăng ký
     * URL: POST http://localhost:8080/pharmacy/users/verify
     * Body: { email, otp }
     */
    verifyOtp: (data) => axiosClient.post('/users/verify', data),

    /**
     * 3. Gửi lại mã OTP
     * URL: POST http://localhost:8080/pharmacy/users/resend-otp
     * Body: { email }
     */
    resendOtp: (data) => axiosClient.post('/users/resend-otp', data),

    /**
     * 5. Đăng nhập hệ thống (Thường nằm ở AuthenticationController)
     * URL: POST http://localhost:8080/pharmacy/auth/token
     */
    login: (data) => axiosClient.post('/auth/token', data),

    /**
     * 6. Đăng nhập bằng Google
     * URL: POST http://localhost:8080/pharmacy/auth/outbound/authentication/google
     */
    loginGoogle: (idToken) => axiosClient.post('/auth/outbound/authentication/google', { idToken }),

    /**
     * 7. Đăng xuất
     */
    logout: () => {
        const refreshToken = localStorage.getItem('refreshToken');

        return axiosClient.post('/auth/logout', {
            refreshToken
        });
    },
    forgotPassword: (email) => axiosClient.post('/users/forgot-password', { email }),

    resetPassword: ({ email, newPassword }) => {
        return axiosClient.post('/users/reset-password', { email, newPassword });
    }
};

export default authService;