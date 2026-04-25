import axios from 'axios';
import { store } from '../redux/store'; // Import store để sử dụng dispatch
import { setLogout } from '../redux/slices/authSlice';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8080/pharmacy'
});

axiosClient.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
});

axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (originalRequest.url.includes('/auth/refresh')) {
            store.dispatch(setLogout()); // Nếu refresh token cũng lỗi thì logout luôn
            return Promise.reject(error);
        }
        // Nếu lỗi 401 (Hết hạn token) và chưa thử lại lần nào
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error("No refresh token");

                // Gọi API refresh token
                const res = await axiosClient.post('/auth/refresh', {
                    refreshToken
                });
                const newAccessToken = res.data.result.token;
                const newRefreshToken = res.data.result.token;
                localStorage.setItem('accessToken', newAccessToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                // Cập nhật header và thực hiện lại request cũ
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return axiosClient(originalRequest);

            } catch (err) {
                // --- ĐÂY LÀ PHẦN BẠN CẦN ---
                // Khi Refresh Token cũng hết hạn hoặc lỗi
                store.dispatch(setLogout()); // Xóa sạch state trong Redux & LocalStorage

                // Chuyển hướng về trang chủ hoặc thông báo yêu cầu đăng nhập lại
                // window.location.href = '/'; 
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;