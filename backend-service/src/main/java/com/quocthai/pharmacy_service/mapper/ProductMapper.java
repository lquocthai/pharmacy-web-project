package com.quocthai.pharmacy_service.mapper;

import com.quocthai.pharmacy_service.dto.response.ProductSummaryResponse;
import com.quocthai.pharmacy_service.entity.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    /**
     * Map Product entity → ProductSummaryResponse.
     *
     * primaryImageUrl: lấy imageUrl của ảnh đầu tiên trong list images
     * (đã được filter isPrimary = true ở query, nên lấy phần tử 0 là đủ).
     * Nếu không có ảnh nào thì trả null — tránh NullPointerException.
     */
    @Mapping(
        target = "primaryImageUrl",
        expression = "java(product.getImages() != null && !product.getImages().isEmpty() " +
                     "? product.getImages().get(0).getImageUrl() : null)"
    )
    ProductSummaryResponse toSummaryResponse(Product product);
}
