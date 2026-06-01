package com.quocthai.pharmacy_service.dto.admin.request;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)

public class ChildCategoryUpdateRequest {
    String id; // CỰC KỲ QUAN TRỌNG: Con nào có ID tức là sửa, con nào ID = null/rỗng tức là ADMIN THÊM MỚI
    String name;
    String description;
    String icon;
}