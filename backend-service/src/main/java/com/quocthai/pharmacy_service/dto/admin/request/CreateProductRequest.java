package com.quocthai.pharmacy_service.dto.admin.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateProductRequest {

    @NotBlank
    String name;

    @NotBlank
    String categorySlug;

    String manufacturer;

    String country;

    String description;

    Boolean prescription;

    /** URL ảnh chính đã được upload lên Cloudinary trước khi gọi API này */
    @NotBlank(message = "Ảnh đại diện chính là bắt buộc")
    String primaryImageUrl;

    /** Danh sách URL ảnh phụ đã được upload lên Cloudinary (có thể rỗng) */
    List<String> subImageUrls;

    List<ProductSpecificationRequest> specifications;

    List<ProductVariantRequest> variants;
}