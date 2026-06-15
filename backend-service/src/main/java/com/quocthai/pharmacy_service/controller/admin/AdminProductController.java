package com.quocthai.pharmacy_service.controller.admin;

import com.quocthai.pharmacy_service.dto.admin.request.CreateProductRequest;
import com.quocthai.pharmacy_service.dto.admin.request.UpdateProductRequest;
import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.admin.response.ProductRespone;
import com.quocthai.pharmacy_service.dto.response.ProductDetailResponse;
import com.quocthai.pharmacy_service.service.ProductService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/admin/products")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminProductController {

    ProductService productService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ProductRespone> createProduct(

            @Valid
            @RequestPart("data")
            CreateProductRequest request,

            @RequestPart("primaryImage")
            MultipartFile primaryImage,

            @RequestPart(value = "subImages", required = false)
            List<MultipartFile> subImages
    ) {

        return ApiResponse.<ProductRespone>builder()
                .result(
                        productService.createProduct(
                                request,
                                primaryImage,
                                subImages
                        )
                )
                .build();
    }

    /**
     * PUT /admin/products/{id}
     * Cập nhật toàn bộ thông tin sản phẩm (thông tin cơ bản, ảnh, specs, variants).
     * Sau khi update DB sẽ tự động sync Elasticsearch document.
     *
     * @param id           Product ID (UUID)
     * @param request      JSON data (multipart part "data")
     * @param primaryImage Ảnh chính mới — optional (null = giữ nguyên ảnh cũ)
     * @param subImages    Danh sách ảnh phụ mới cần thêm — optional
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<String> updateProduct(
            @PathVariable String id,
            @RequestPart("data") UpdateProductRequest request,
            @RequestPart(value = "primaryImage", required = false) MultipartFile primaryImage,
            @RequestPart(value = "subImages", required = false) List<MultipartFile> subImages
    ) {
        log.info("update",request);
        return ApiResponse.<String>builder()
                .result(
                        productService.updateProduct(id, request, primaryImage, subImages)
                )
                .build();
    }
    @PatchMapping("/{id}/active")
    public ApiResponse<String> updateProductActiveStatus(
            @PathVariable String id,
            @RequestParam("status") boolean status
    ) {
        return ApiResponse.<String>builder()
                .result(
                        productService.updateActiveStatus(id, status)
                )
                .build();
    }

}
