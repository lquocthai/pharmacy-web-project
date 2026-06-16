package com.quocthai.pharmacy_service.dto.admin.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateProductRequest {

    String name;
    String categorySlug;
    String manufacturer;
    String description;
    String country;
    boolean prescription;

    /**
     * URL ảnh chính mới nếu người dùng đã upload lại.
     * null = giữ nguyên ảnh chính cũ.
     */
    String primaryImageUrl;

    /**
     * Danh sách URL ảnh phụ MỚI cần thêm vào (đã upload lên Cloudinary).
     * Khác với deletedImageIds — đây là ảnh cần INSERT thêm.
     */
    List<String> newSubImageUrls;

    /** ID của các ảnh phụ hiện có cần xóa khỏi DB */
    List<String> deletedImageIds;

    List<UpdateSpecificationRequest> specifications;

    List<UpdateVariantRequest> variants;

    List<String> deletedVariantIds;
}
