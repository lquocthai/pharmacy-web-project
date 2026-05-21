package com.quocthai.pharmacy_service.dto.request;

import com.quocthai.pharmacy_service.constants.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PlaceOrderRequest {

    @NotBlank(message = "Vui lòng chọn địa chỉ giao hàng")
    String addressId;

    @NotNull(message = "Vui lòng chọn phương thức thanh toán")
    PaymentMethod paymentMethod;

    String note;
}
