package com.quocthai.pharmacy_service.mapper;

import com.quocthai.pharmacy_service.dto.admin.response.ProductRespone;
import com.quocthai.pharmacy_service.dto.response.ProductImageResponse;
import com.quocthai.pharmacy_service.dto.response.ProductSpecificationResponse;
import com.quocthai.pharmacy_service.dto.response.ProductVariantResponse;
import com.quocthai.pharmacy_service.entity.Product;
import com.quocthai.pharmacy_service.entity.ProductImage;
import com.quocthai.pharmacy_service.entity.ProductSpecification;
import com.quocthai.pharmacy_service.entity.ProductVariant;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductMapper {
    @Mapping(target = "categorySlug", source = "category.slug")
    @Mapping(target = "primaryImg", expression = "java(getPrimaryImage(product))")
    @Mapping(target = "images", source = "images")
    @Mapping(target = "specifications", source = "specifications")
    @Mapping(target = "variants", source = "variants")
    ProductRespone toResponseAdmin(Product product);

    // =========================
    // IMAGE
    // =========================

    ProductImageResponse toImageResponse(ProductImage image);

    List<ProductImageResponse> toImageResponses(
            List<ProductImage> images
    );

    // =========================
    // SPECIFICATION
    // =========================

    ProductSpecificationResponse toSpecificationResponse(
            ProductSpecification specification
    );

    List<ProductSpecificationResponse> toSpecificationResponses(
            List<ProductSpecification> specifications
    );

    // =========================
    // VARIANT
    // =========================

    ProductVariantResponse toVariantResponse(
            ProductVariant variant
    );

    List<ProductVariantResponse> toVariantResponses(
            List<ProductVariant> variants
    );

    // =========================
    // CUSTOM METHODS
    // =========================

    default String getPrimaryImage(Product product) {

        if (product.getImages() == null) {
            return null;
        }

        return product.getImages()
                .stream()
                .filter(ProductImage::isPrimary)
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse(null);
    }

}
