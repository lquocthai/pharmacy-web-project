package com.quocthai.pharmacy_service.dto.admin.request;
import jakarta.validation.constraints.NotBlank;
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

    List<String> deletedImageIds;

    List<UpdateSpecificationRequest> specifications;

    List<UpdateVariantRequest> variants;

    List<String> deletedVariantIds;
}
