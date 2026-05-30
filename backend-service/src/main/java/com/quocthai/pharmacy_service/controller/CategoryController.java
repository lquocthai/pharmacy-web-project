package com.quocthai.pharmacy_service.controller;

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
}