package com.quocthai.pharmacy_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductSummaryResponse {
    String id;
    String name;
    String slug;
    boolean isPrescription;
    String manufacturer;
    String country;

    // Ảnh primary để hiển thị ngoài danh sách
    String primaryImageUrl;

    // Category
    String categoryId;
    String categoryName;
    String categorySlug;

    // Tất cả variants — FE dùng để hiển thị chọn quy cách và giá
    List<ProductVariantResponse> variants;
}
