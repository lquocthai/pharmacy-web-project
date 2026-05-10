package com.quocthai.pharmacy_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductDetailInfoResponse {
    String usage;
    String sideEffects;
    String contraindications;
    String storage;
    String composition;
    String description;
}
