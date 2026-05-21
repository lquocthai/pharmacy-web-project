package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.dto.response.CategoryResponse;
import com.quocthai.pharmacy_service.entity.Category;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.repository.CategoryRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CategoryService {
    CategoryRepository categoryRepository;


    public CategoryResponse getCategoryTreeBySlug(String slug) {
        // 1. Tìm danh mục cha lớn nhất (ví dụ: Dược mỹ phẩm)
        Category parentCategory = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // 2. Chuyển đổi sang cấu trúc cây DTO và trả về
        return convertToDto(parentCategory);
    }

    // Hàm đệ quy để map từ Entity sang DTO xuyên suốt các cấp con, cháu
    private CategoryResponse convertToDto(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .icon(category.getIcon())
                .children(category.getChildren() != null ?
                        category.getChildren().stream()
                                .map(this::convertToDto) // Đệ quy gọi lại chính nó cho các con
                                .collect(Collectors.toList())
                        : null)
                .build();
    }
}
