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
    boolean isPrescription;
    String description;

    String manufacturer;
    String country;

    // Category
    String categoryId;
    String categoryName;
    String categorySlug;

    // Ảnh dùng chung của sản phẩm gốc
    List<ProductImageResponse> images;

    // Danh sách các cấu hình SKU (Hộp, vỉ...) để FE render chọn lựa
    List<ProductVariantResponse> variants;

    // Trả ra một list thông số đã được sắp xếp theo displayOrder để FE chạy vòng lặp render
    List<ProductSpecificationResponse> specifications;
    // Tổng tồn kho của TẤT CẢ các phân loại cộng lại
    int totalStockQuantity;

    // Tổng hợp rating
    RatingSummaryResponse ratingSummary;
}