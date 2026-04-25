import axiosClient from '../configs/axiosConfig.js';

/**
 * GET /users/me → ApiResponse<UserResponse>
 * UserResponse: { id, username, email, dob, phone, address, sex, provider, roles }
 */
const profileService = {
    getMe: () => axiosClient.get('/users/me'),
};

export default profileService;
