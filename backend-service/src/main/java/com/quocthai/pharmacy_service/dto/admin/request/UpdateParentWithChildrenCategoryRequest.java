package com.quocthai.pharmacy_service.dto.admin.request;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateParentWithChildrenCategoryRequest {
    String name;
    String description;
    String icon;

    // Danh sách con gửi lên để cập nhật
    List<ChildCategoryUpdateRequest> children;
}
