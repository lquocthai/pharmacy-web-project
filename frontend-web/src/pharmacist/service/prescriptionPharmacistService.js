import axiosClient from '../../configs/axiosConfig.js';

const prescriptionServicePharmacist = {
    /**
     * 1. API Lấy danh sách đơn thuốc (Có bộ lọc và phân trang)
     * * @param {Object} params - Các tham số lọc và phân trang
     * @param {string} [params.fullName] - (Tùy chọn) Tìm kiếm theo tên khách hàng (không phân biệt hoa thường, tìm kiếm gần đúng)
     * @param {string} [params.status] - (Tùy chọn) Lọc theo trạng thái đơn thuốc ['PENDING', 'CONSULTED', 'UNREACHABLE', 'CANCELLED']
     * @param {number} [params.page] - (Tùy chọn) Số trang muốn lấy (bắt đầu từ 0)
     * @param {number} [params.size] - (Tùy chọn) Số lượng phần tử trên một trang
     * @param {string} [params.sort] - (Tùy chọn) Sắp xếp theo trường nào và hướng nào (Ví dụ: 'createdAt,desc')
     * * @request {GET} /pharmacist/prescriptions?fullName=An&status=PENDING&page=0&size=10
     * * @response {Object} Cấu trúc dữ liệu trả về (ApiResponse mang Page Spring Boot)
     * {
     * "result": {
     * "content": [
     * {
     * "id": "uuid-string-1",
     * "fullName": "Nguyễn Văn An",
     * "phoneNumber": "0901234567",
     * "note": "Tôi bị ho và đau họng 3 ngày nay",
     * "status": "PENDING",
     * "pharmacistNote": null,
     * "consultedAt": null,
     * "createdAt": "2026-06-10T10:00:00",
     * "updatedAt": "2026-06-10T10:00:00",
     * "imageUrls": [
     * "https://example.com/images/don-thuoc-1.jpg",
     * "https://example.com/images/don-thuoc-2.jpg"
     * ]
     * }
     * ],
     * "pageable": { ... },
     * "totalElements": 1,
     * "totalPages": 1,
     * "size": 10,
     * "number": 0,
     * "empty": false
     * }
     * }
     */
    getPrescriptions: (params) => {
        return axiosClient.get('pharmacist/prescriptions', { params });
    },

    /**
     * 2. API Cập nhật trạng thái đơn thuốc và ghi chú của dược sĩ
     * * @param {string} id - ID của đơn thuốc cần cập nhật (Dạng UUID)
     * @param {Object} data - Dữ liệu cập nhật
     * @param {string} data.status - Trạng thái mới bắt buộc phải điền ['PENDING', 'CONSULTED', 'UNREACHABLE', 'CANCELLED']
     * @param {string} [data.pharmacistNote] - (Tùy chọn) Ghi chú, dặn dò của dược sĩ dành cho đơn thuốc này
     * * @request {PATCH} /pharmacist/prescriptions/uuid-string-1/status
     * Body gửi lên (JSON):
     * {
     * "status": "CONSULTED",
     * "pharmacistNote": "Đã gọi điện tư vấn uống thuốc sau ăn 30 phút."
     * }
     * * @response {Object} Cấu trúc dữ liệu trả về sau khi cập nhật thành công
     * {
     * "result": {
     * "id": "uuid-string-1",
     * "fullName": "Nguyễn Văn An",
     * "phoneNumber": "0901234567",
     * "note": "Tôi bị ho và đau họng 3 ngày nay",
     * "status": "CONSULTED",
     * "pharmacistNote": "Đã gọi điện tư vấn uống thuốc sau ăn 30 phút.",
     * "consultedAt": "2026-06-10T12:21:45",
     * "createdAt": "2026-06-10T10:00:00",
     * "updatedAt": "2026-06-10T12:21:45",
     * "imageUrls": [
     * "https://example.com/images/don-thuoc-1.jpg"
     * ]
     * }
     * }
     */
    updateStatus: (id, data) => {
        return axiosClient.patch(`pharmacist/prescriptions/${id}/status`, data);
    }
}

export default prescriptionServicePharmacist;