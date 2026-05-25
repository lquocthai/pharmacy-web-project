package com.quocthai.pharmacy_service.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddToCartRequest {

    @NotBlank(message = "variantId không được để trống")
    String variantId; // Đổi từ productId sang variantId để chỉ định chính xác SKU phân loại

    @Min(value = 1, message = "INVALID_QUANTITY")
    int quantity;
}
