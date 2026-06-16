package com.quocthai.pharmacy_service.mapper;

import com.quocthai.pharmacy_service.dto.response.pharmacist.PharmacistRatingDetailResponse;
import com.quocthai.pharmacy_service.dto.response.pharmacist.PharmacistRatingListResponse;
import com.quocthai.pharmacy_service.entity.Product;
import com.quocthai.pharmacy_service.entity.ProductImage;
import com.quocthai.pharmacy_service.entity.Rating;
import com.quocthai.pharmacy_service.entity.RatingReply;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Collections;
import java.util.List;

@Mapper(componentModel = "spring")
public interface PharmacistRatingMapper {

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "productImage", expression = "java(resolveProductImage(rating.getProduct()))")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userName", source = "user.username")
    PharmacistRatingListResponse toListResponse(Rating rating);

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "productImage", expression = "java(resolveProductImage(rating.getProduct()))")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userFullName", source = "user.username")
    @Mapping(target = "replies", expression = "java(mapReplies(rating.getReplies()))")
    PharmacistRatingDetailResponse toDetailResponse(Rating rating);

    @Mapping(target = "replyId", source = "id")
    @Mapping(target = "pharmacistId", source = "repliedBy.id")
    @Mapping(target = "pharmacistName", source = "repliedBy.username")
    PharmacistRatingDetailResponse.RatingReplyInfo toReplyInfo(RatingReply reply);

    default String resolveProductImage(Product  product) {
        if (product.getImages() == null || product.getImages().isEmpty()) {
            return null;
        }
        return product.getImages().stream()
                .filter(ProductImage::isPrimary)
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse(product.getImages().get(0).getImageUrl());
    }

    default List<PharmacistRatingDetailResponse.RatingReplyInfo> mapReplies(List<RatingReply> replies) {
        if (replies == null) {
            return Collections.emptyList();
        }
        return replies.stream().map(this::toReplyInfo).toList();
    }
}
