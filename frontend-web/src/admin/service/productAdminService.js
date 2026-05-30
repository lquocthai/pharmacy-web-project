

import axiosClient from '../../configs/axiosConfig.js';

const productAdminService = {
    getAdminProducts: (params) => {
        return axiosClient.get('/products/admin/products', {
            params
        });
    },
    // Lấy chi tiết sản phẩm theo slug
    getDetail: (slug) =>
        axiosClient.get(`/products/admin/detail/${slug}`),
    // =========================
    // CREATE PRODUCT
    // =========================
    // =========================
    // UPDATE PRODUCT
    updateProduct: async (id, productData) => {

        const formData = new FormData();

        // =========================
        // JSON DATA
        // =========================
        formData.append(
            'data',
            new Blob(
                [
                    JSON.stringify({
                        name: productData.name,
                        categorySlug: productData.categorySlug,
                        manufacturer: productData.manufacturer,
                        country: productData.country,
                        description: productData.description,
                        prescription: productData.prescription,
                        specifications: productData.specifications,
                        variants: productData.variants,

                        // OPTIONAL: nếu backend support delete
                        deletedImageIds: productData.deletedImageIds || [],
                        deletedVariantIds: productData.deletedVariantIds || []
                    })
                ],
                { type: 'application/json' }
            )
        );

        // =========================
        // PRIMARY IMAGE
        // =========================
        if (productData.primaryImageFile) {
            formData.append(
                'primaryImage',
                productData.primaryImageFile
            );
        }

        // =========================
        // SUB IMAGES
        // =========================
        if (productData.subImageUrls?.length > 0) {
            productData.subImageUrls.forEach((item) => {
                if (item.file) {
                    formData.append('subImages', item.file);
                }
            });
        }

        // =========================
        // API CALL (PUT)
        // =========================
        return axiosClient.put(
            `/admin/products/${id}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
    },
    createProduct: async (productData) => {

        const formData = new FormData();

        // =========================
        // JSON DATA
        // =========================

        formData.append(
            'data',
            new Blob(
                [
                    JSON.stringify({
                        name: productData.name,
                        categorySlug: productData.categorySlug,
                        manufacturer: productData.manufacturer,
                        country: productData.country,
                        description: productData.description,
                        prescription: productData.prescription,

                        specifications: productData.specifications,

                        variants: productData.variants
                    })
                ],
                {
                    type: 'application/json'
                }
            )
        );

        // =========================
        // PRIMARY IMAGE
        // =========================

        if (productData.primaryImageFile) {
            formData.append(
                'primaryImage',
                productData.primaryImageFile
            );
        }

        // =========================
        // SUB IMAGES
        // =========================

        if (
            productData.subImageUrls &&
            productData.subImageUrls.length > 0
        ) {

            productData.subImageUrls.forEach((item) => {

                if (item.file) {
                    formData.append(
                        'subImages',
                        item.file
                    );
                }
            });
        }
        return axiosClient.post(
            '/admin/products',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
    }

};

export default productAdminService;
