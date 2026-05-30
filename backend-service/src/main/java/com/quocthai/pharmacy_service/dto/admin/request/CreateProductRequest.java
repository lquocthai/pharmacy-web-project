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
public class CreateProductRequest {

    @NotBlank
    String name;

    @NotBlank
    String categorySlug;

    String manufacturer;

    String country;

    String description;

    Boolean prescription;

    List<ProductSpecificationRequest> specifications;

    List<ProductVariantRequest> variants;
}