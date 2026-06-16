package com.quocthai.pharmacy_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductSpecificationResponse {
    String specKey;      // Ví dụ: "Thành phần", "Công dụng", "Cách dùng"
    String specValue;    // Ví dụ: "Paracetamol 500mg", "Giảm đau hạ sốt", "Uống sau khi ăn"
}