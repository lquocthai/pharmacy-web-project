package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.dto.admin.request.SingleParentWithChildrenCategoryRequest;
import com.quocthai.pharmacy_service.dto.admin.request.UpdateParentWithChildrenCategoryRequest;
import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.CategoryResponse;
import com.quocthai.pharmacy_service.service.CategoryService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CategoryController {

    CategoryService categoryService;

    @GetMapping("/{slug}/tree")
    public ApiResponse<CategoryResponse> getCategoryTree(@PathVariable String slug) {
        return ApiResponse.<CategoryResponse>builder()
                .result(categoryService.getCategoryTreeBySlug(slug))
                .build();
    }

    // admin
    @GetMapping()
    public ApiResponse<List<CategoryResponse>> getAll() {
        return ApiResponse.<List<CategoryResponse>>builder()
                .result(categoryService.getAll())
                .build();
    }

    @GetMapping("/admin/{id}")
    public ApiResponse<CategoryResponse> getCategoryById(@PathVariable String id) {
        return ApiResponse.<CategoryResponse>builder()
                .result(categoryService.getCategoryById(id))
                .build();
    }

    // ==========================================
    // ENDPOINTS DÀNH CHO ADMIN (CRUD)
    // ==========================================



    // 2. Tạo nhanh 1 danh mục cha và một loạt danh mục con trực thuộc (Hàm tối ưu hiệu năng bạn vừa viết)
    @PostMapping("/admin")
    public ApiResponse<CategoryResponse> createParentWithChildren(
            @RequestBody SingleParentWithChildrenCategoryRequest request) {
        return ApiResponse.<CategoryResponse>builder()
                .result(categoryService.createParentWithChildren(request))
                .build();
    }

    // 3. Cập nhật thông tin danh mục bằng ID
    @PutMapping("/admin/{id}")
    public ApiResponse<CategoryResponse> updateCategory(
            @PathVariable String id,
            @RequestBody UpdateParentWithChildrenCategoryRequest request) {
        return ApiResponse.<CategoryResponse>builder()
                .result(categoryService.updateCategory(id, request))
                .build();
    }

    // 4. Xóa danh mục bằng ID (Cascade xóa sạch các con trực thuộc)
    @DeleteMapping("/admin/{id}")
    public ApiResponse<String> deleteCategory(@PathVariable String id) {
        categoryService.deleteCategory(id);
        return ApiResponse.<String>builder()
                .result("Xóa danh mục thành công!")
                .build();
    }
}