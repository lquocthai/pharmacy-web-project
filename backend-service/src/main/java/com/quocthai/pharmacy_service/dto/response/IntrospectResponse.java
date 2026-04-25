package com.quocthai.pharmacy_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class IntrospectResponse {
    boolean valid; // Biến này tạo ra hàm isValid() hoặc getValid() cho CustomJwtDecoder
}