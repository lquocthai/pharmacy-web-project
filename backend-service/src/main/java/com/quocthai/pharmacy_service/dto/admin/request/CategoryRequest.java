package com.quocthai.pharmacy_service.dto.admin.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CategoryRequest {
    String name;
    String description;
    String icon;
    String parentId; // Nếu là danh mục lớn nhất (Cấp 1) thì fe truyền null hoặc rỗng
}