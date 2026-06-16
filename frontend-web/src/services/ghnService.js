import axios from "axios";


// Cấu hình chung cho GHN API
const GHN_TOKEN = import.meta.env.VITE_GHN_TOKEN; // Thay bằng Token thật của bạn
const SHOP_ID = import.meta.env.VITE_GHN_SHOP_ID; // Thay bằng Shop ID thật của bạn
const BASE_URL = import.meta.env.VITE_GHN_API_URL; // Thay bằng URL API thật của bạn

const ghnRequest = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Token': GHN_TOKEN,
        'Content-Type': 'application/json'
    }
});

const ghnService = {
    // 1. Lấy danh sách Tỉnh/Thành
    getProvinces: async () => {
        try {
            const response = await ghnRequest.get('/master-data/province');
            return response.data.data; // Trả về mảng các Tỉnh
        } catch (error) {
            console.error('Lỗi lấy Tỉnh/Thành:', error.response?.data || error.message);
            throw error;
        }
    },

    // 2. Lấy danh sách Quận/Huyện theo province_id
    getDistricts: async (provinceId) => {
        try {
            const response = await ghnRequest.get('/master-data/district', {
                params: {
                    province_id: provinceId
                }
            });
            return response.data.data;
        } catch (error) {
            console.error('Lỗi lấy Quận/Huyện:', error.response?.data || error.message);
            throw error;
        }
    },

    // 3. Lấy danh sách Phường/Xã theo district_id
    getWards: async (districtId) => {
        try {
            const response = await ghnRequest.get('/master-data/ward', {
                params: {
                    district_id: districtId
                }
            });
            return response.data.data;
        } catch (error) {
            console.error('Lỗi lấy Phường/Xã:', error.response?.data || error.message);
            throw error;
        }
    },

    // 4. Tính phí vận chuyển nhanh (Dùng cho Pharmacy của bạn)
    calculateShippingFee: async (data) => {
        try {
            console.log('Calculating shipping fee with data:', data); // Debug log
            const payload = {
                "service_id": 0,
                "service_type_id": 2, // Gói chuẩn
                "from_district_id": Number(import.meta.env.VITE_GHN_FROM_DISTRICT_ID), // Thủ Đức (Kho mặc định)
                "from_ward_code": import.meta.env.VITE_GHN_FROM_WARD_CODE, // Phường Linh Trung (Kho mặc định)
                "to_district_id": data.to_district_id, // Quận/Huyện của khách
                "to_ward_code": data.to_ward_code,
                "weight": Number(import.meta.env.VITE_GHN_WEIGHT) || 200, // Mặc định 200g nếu không truyền
                "length": Number(import.meta.env.VITE_GHN_LENGTH) || 10,
                "width": Number(import.meta.env.VITE_GHN_WIDTH) || 10,
                "height": Number(import.meta.env.VITE_GHN_HEIGHT) || 10,
                "insurance_value": data.insurance_value || 0,
                "coupon": null
            };
            console.log('Payload for GHN fee calculation:', payload); // Debug log

            const response = await ghnRequest.post('/v2/shipping-order/fee', payload, {
                headers: { 'ShopId': import.meta.env.VITE_GHN_SHOP_ID }
            });

            return response.data.data.total; // Trả về con số tổng phí ship
        } catch (error) {
            console.error('Lỗi tính phí ship:', error.response?.data || error.message);
            throw error;
        }
    }
};

export default ghnService;