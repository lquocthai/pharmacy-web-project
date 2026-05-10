package com.quocthai.pharmacy_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductDetailResponse {
    String id;
    String name;
    String slug;
    double price;
    double oldPrice;
    String unit;
    boolean isPrescription;
    String manufacturer;
    String country;

    // Category
    String categoryId;
    String categoryName;
    String categorySlug;

    // Tất cả ảnh (FE tự chọn primary)
    List<ProductImageResponse> images;

    // Chi tiết sản phẩm
    ProductDetailInfoResponse detail;

    // Tồn kho
    int stockQuantity;

    // Tổng hợp rating — tính sẵn để FE không cần gọi thêm API
    RatingSummaryResponse ratingSummary;
}
