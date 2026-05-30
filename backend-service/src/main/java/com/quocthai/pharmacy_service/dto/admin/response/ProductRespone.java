package com.quocthai.pharmacy_service.dto.admin.response;


import com.quocthai.pharmacy_service.dto.response.ProductImageResponse;
import com.quocthai.pharmacy_service.dto.response.ProductSpecificationResponse;
import com.quocthai.pharmacy_service.dto.response.ProductVariantResponse;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductRespone {
    String id;
    String name;
    String slug;
    boolean isPrescription;
    String description;

    String manufacturer;
    String country;

    String categorySlug;
    String primaryImg;
    // Ảnh dùng chung của sản phẩm gốc
    List<ProductImageResponse> images;

    // Danh sách các cấu hình SKU (Hộp, vỉ...) để FE render chọn lựa
    List<ProductVariantResponse> variants;

    // Trả ra một list thông số đã được sắp xếp theo displayOrder để FE chạy vòng lặp render
    List<ProductSpecificationResponse> specifications;

}
