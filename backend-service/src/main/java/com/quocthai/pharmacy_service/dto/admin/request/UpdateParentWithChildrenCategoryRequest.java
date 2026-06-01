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
    String parentId; // Giữ nguyên nếu muốn đổi cha cấp cao hơn

    // Danh sách con gửi lên để cập nhật
    List<ChildCategoryUpdateRequest> children;
}
