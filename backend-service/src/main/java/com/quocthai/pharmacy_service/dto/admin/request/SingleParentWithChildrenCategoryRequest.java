package com.quocthai.pharmacy_service.dto.admin.request;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SingleParentWithChildrenCategoryRequest {
    // Thông tin của danh mục Cha (Gốc)
    String name;
    String description;
    String icon;
    // Danh sách các danh mục con cấp dưới trực tiếp (Chỉ là một mảng phẳng, không lồng thêm children nữa)
    List<ChildCategoryRequest> children;
}
