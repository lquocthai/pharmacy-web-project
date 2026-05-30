package com.quocthai.pharmacy_service.dto.admin.request;
import lombok.*;
import lombok.experimental.FieldDefaults;


@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateSpecificationRequest {
    String id;
    Integer displayOrder;
    String specKey;
    String specValue;
}
