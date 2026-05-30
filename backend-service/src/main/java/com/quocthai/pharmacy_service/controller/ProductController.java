package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.PageResponse;
import com.quocthai.pharmacy_service.dto.response.ProductDetailResponse;
import com.quocthai.pharmacy_service.dto.response.ProductSummaryResponse;
import com.quocthai.pharmacy_service.service.ProductService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/products")
public class ProductController {

    ProductService productService;

    @GetMapping
    public ApiResponse<PageResponse<ProductSummaryResponse>> getProducts(
            @RequestParam String categorySlug,
            @RequestParam(defaultValue = "0")
            int page,
            @RequestParam(defaultValue = "20")
            int size,
            @RequestParam(defaultValue = "createdAt")
            String sortBy,
            @RequestParam(defaultValue = "desc")
            String sortDir) {
        return ApiResponse
                .<PageResponse<ProductSummaryResponse>>builder()
                .result(productService.getProductsByCategory(categorySlug, page, size, sortBy, sortDir))
                .build();
    }

    /**
     * GET /products/detail/{slug}
     * Lấy chi tiết sản phẩm theo slug — bao gồm thông tin đầy đủ + rating summary.
     */
    @GetMapping("/detail/{slug}")
    ApiResponse<ProductDetailResponse> getProductDetail(@PathVariable("slug") String slug) {
        log.info("GET /products/detail/{}", slug);
        return ApiResponse.<ProductDetailResponse>builder()
                .result(productService.getProductDetail(slug))
                .build();
    }

    // cho admin==> sai hàm này rồi sửa lại
    @GetMapping("/admin/products")
    public ApiResponse<PageResponse<ProductSummaryResponse>> getAdminProducts(
            @RequestParam(required = false)
            String keyword,
            @RequestParam(required = false)
            String categoryId,
            @RequestParam(defaultValue = "0")
            int page,
            @RequestParam(defaultValue = "10")
            int size,
            @RequestParam(defaultValue = "name")
            String sortBy,
            @RequestParam(defaultValue = "desc")
            String sortDir
    ) {

        return ApiResponse
                .<PageResponse<ProductSummaryResponse>>builder()
                .result(
                        productService.getAdminProducts(
                                keyword,
                                categoryId,
                                page,
                                size,
                                sortBy,
                                sortDir
                        )
                )
                .build();
    }


    // admin lấy product detail
    @GetMapping("admin/detail/{slug}")
    ApiResponse<ProductDetailResponse> getProductDetailAdmin(@PathVariable("slug") String slug) {
        return ApiResponse.<ProductDetailResponse>builder()
                .result(productService.getProductDetailAdmin(slug))
                .build();
    }

}
