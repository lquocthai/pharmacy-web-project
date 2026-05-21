package com.quocthai.pharmacy_service.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateOrderRequest {

    @NotBlank(message = "ADDRESS_ID_REQUIRED")
    String addressId;

    @NotBlank(message = "PAYMENT_METHOD_REQUIRED")
    String paymentMethod; // COD | VNPAY | MOMO

    String note;

    @NotNull(message = "SHIPPING_FEE_REQUIRED")
    Long shippingFee;

    @NotNull(message = "TOTAL_AMOUNT_REQUIRED")
    Long totalAmount;

    @Valid
    @NotEmpty(message = "ORDER_ITEMS_REQUIRED")
    List<OrderItemRequest> items;
}