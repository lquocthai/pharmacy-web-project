package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.PageResponse;
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

    /**
     * GET /products/{categorySlug}
     *
     * Lấy danh sách sản phẩm theo category slug với phân trang và sắp xếp.
     *
     * @param categorySlug slug của danh mục (vd: thuc-pham-chuc-nang)
     * @param page         trang hiện tại, bắt đầu từ 0 (mặc định: 0)
     * @param size         số sản phẩm mỗi trang (mặc định: 20, tối đa: 100)
     * @param sortBy       field sort: name | price | manufacturer (mặc định: name)
     * @param sortDir      hướng sort: asc | desc (mặc định: asc)
     *
     * Ví dụ: GET /products/thuc-pham-chuc-nang?page=0&size=20&sortBy=price&sortDir=asc
     */
    @GetMapping("/{categorySlug}")
    ApiResponse<PageResponse<ProductSummaryResponse>> getProductsByCategory(
            @PathVariable("categorySlug") String categorySlug,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc")  String sortDir
    ) {
        log.info("GET /products/{} - page={}, size={}, sortBy={}, sortDir={}",
                categorySlug, page, size, sortBy, sortDir);

        var result = productService.getProductsByCategory(categorySlug, page, size, sortBy, sortDir);

        return ApiResponse.<PageResponse<ProductSummaryResponse>>builder()
                .result(result)
                .build();
    }
}
