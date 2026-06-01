package com.quocthai.pharmacy_service.dto.response;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CategoryResponse {
     String id;
     String name;
     String slug;
     String description;
     String parentId;
     String icon;
     List<CategoryResponse> children; // Đệ quy chứa các danh mục con/cháu
}