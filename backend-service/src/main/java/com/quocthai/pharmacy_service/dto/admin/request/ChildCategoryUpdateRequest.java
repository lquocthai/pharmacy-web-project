package com.quocthai.pharmacy_service.dto.admin.request;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)

public class ChildCategoryUpdateRequest {
    String id;
    String name;
    String description;
    String icon;
}