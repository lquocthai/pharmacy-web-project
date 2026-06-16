package com.quocthai.pharmacy_service.controller.admin;

import com.quocthai.pharmacy_service.dto.admin.request.CreateProductRequest;
import com.quocthai.pharmacy_service.dto.admin.request.UpdateProductRequest;
import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.admin.response.ProductRespone;
import com.quocthai.pharmacy_service.dto.response.ProductDetailResponse;
import com.quocthai.pharmacy_service.service.ElasticsearchHealthService;
import com.quocthai.pharmacy_service.service.ProductService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/products")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminProductController {

    ProductService productService;
    ElasticsearchHealthService elasticsearchHealthService;

    /**
     * POST /admin/products
     * Tạo sản phẩm mới. Ảnh đã được upload lên Cloudinary từ FE trước khi gọi API này.
     * Request body là JSON thuần (application/json).
     */
    @PostMapping
    public ApiResponse<ProductRespone> createProduct(
            @Valid @RequestBody CreateProductRequest request
    ) {
        return ApiResponse.<ProductRespone>builder()
                .result(productService.createProduct(request))
                .build();
    }

    /**
     * PUT /admin/products/{id}
     * Cập nhật sản phẩm. Ảnh mới (nếu có) đã được upload lên Cloudinary từ FE trước khi gọi.
     * Request body là JSON thuần (application/json).
     *
     * @param id      Product ID (UUID)
     * @param request JSON data chứa thông tin cơ bản, primaryImageUrl (optional), newSubImageUrls, deletedImageIds...
     */
    @PutMapping("/{id}")
    public ApiResponse<String> updateProduct(
            @PathVariable String id,
            @RequestBody UpdateProductRequest request
    ) {
        log.info("Update product id={}", id);
        return ApiResponse.<String>builder()
                .result(productService.updateProduct(id, request))
                .build();
    }

    /**
     * PATCH /admin/products/{id}/active
     * Bật/tắt trạng thái kinh doanh sản phẩm.
     */
    @PatchMapping("/{id}/active")
    public ApiResponse<String> updateProductActiveStatus(
            @PathVariable String id,
            @RequestParam("status") boolean status
    ) {
        return ApiResponse.<String>builder()
                .result(productService.updateActiveStatus(id, status))
                .build();
    }
    // sync data to elasticsearch
    /**
     * GET /admin/products/sync
     * API đồng bộ dữ liệu sang Elasticsearch trả về ApiResponse chuẩn format dự án
     */
    @GetMapping("/sync")
    public ApiResponse<String> syncData() {
        log.info("Kích hoạt đồng bộ toàn bộ sản phẩm sang Elasticsearch...");

        // Gọi hàm sync từ service của bạn
        elasticsearchHealthService.syncAllProductsToElasticsearch();

        return ApiResponse.<String>builder()
                .result("Đồng bộ dữ liệu sang Elastic Cloud thành công!")
                .build();
    }
}
