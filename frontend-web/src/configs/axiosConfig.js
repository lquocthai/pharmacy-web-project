import axios from 'axios';

// KHÔNG import store hay setLogout ở đầu file để tránh Circular Dependency và lỗi đứng App
const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
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
            //  Cú pháp Dynamic Import đúng trong hàm: Sử dụng hàm import() và await
            const { store } = await import('../redux/store');
            const { setLogout } = await import('../redux/slices/authSlice');

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
                // Trước khi sửa:
                // const res = await axiosClient.post('http://localhost:8080/pharmacy/auth/refresh', { ... })

                // Sau khi sửa (Dùng đường dẫn tương đối, Axios sẽ tự khớp với biến VITE_API_BASE_URL):
                const res = await axiosClient.post('/auth/refresh', {
                    refreshToken
                });
                const newAccessToken = res.data.result.accessToken;
                const newRefreshToken = res.data.result.refreshToken;
                localStorage.setItem('accessToken', newAccessToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                // Cập nhật header và thực hiện lại request cũ
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axiosClient(originalRequest);

            } catch (err) {
                // 🔥 Cú pháp Dynamic Import đúng trong khối catch
                const { store } = await import('../redux/store');
                const { setLogout } = await import('../redux/slices/authSlice');

                // Khi Refresh Token cũng hết hạn hoặc lỗi
                store.dispatch(setLogout()); // Xóa sạch state trong Redux & LocalStorage

                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;