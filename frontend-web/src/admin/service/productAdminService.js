import axiosClient from '../../configs/axiosConfig.js';

const productAdminService = {
    // =========================================================================
    // UPDATE ACTIVE STATUS (BẬT/TẮT KINH DOANH SẢN PHẨM)
    // =========================================================================
    updateActiveStatus: (id, status) => {
        return axiosClient.patch(`/admin/products/${id}/active`, null, {
            params: { status }
        });
    },

    getAdminProducts: (params) => {
        return axiosClient.get('/products/admin/products', { params });
    },

    // Lấy chi tiết sản phẩm theo slug
    getDetail: (slug) => axiosClient.get(`/products/admin/detail/${slug}`),

    // =========================================================================
    // CREATE PRODUCT
    // Ảnh đã được upload trước — chỉ gửi URL dạng JSON thuần.
    // =========================================================================
    createProduct: (productData) => {
        return axiosClient.post('/admin/products', {
            name: productData.name,
            categorySlug: productData.categorySlug,
            manufacturer: productData.manufacturer,
            country: productData.country,
            description: productData.description,
            prescription: productData.prescription,
            primaryImageUrl: productData.primaryImageUrl,
            subImageUrls: productData.subImageUrls || [],
            specifications: productData.specifications,
            variants: productData.variants
        });
    },

    // =========================================================================
    // UPDATE PRODUCT
    // Ảnh mới đã được upload trước — chỉ gửi URL dạng JSON thuần.
    // =========================================================================
    updateProduct: (id, productData) => {
        return axiosClient.put(`/admin/products/${id}`, {
            name: productData.name,
            categorySlug: productData.categorySlug,
            manufacturer: productData.manufacturer,
            country: productData.country,
            description: productData.description,
            prescription: productData.prescription,
            // URL ảnh chính mới (nếu đã thay đổi), null = giữ nguyên ảnh cũ
            primaryImageUrl: productData.newPrimaryImageUrl || null,
            // Các URL ảnh phụ MỚI cần thêm (đã upload lên Cloudinary)
            newSubImageUrls: productData.newSubImageUrls || [],
            // ID các ảnh phụ cần xóa
            deletedImageIds: (productData.deletedImageIds || []).filter(
                (id) => id && !id.startsWith('local-')
            ),
            specifications: productData.specifications,
            variants: productData.variants,
            deletedVariantIds: productData.deletedVariantIds || []
        });
    },
    syncElasticData: () => {
        return axiosClient.get('/admin/products/sync');
    }

};

export default productAdminService;
