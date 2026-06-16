package com.quocthai.pharmacy_service.dto.admin.request;

import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ImportInventoryRequest {

    @NotBlank(message = "variantId không được trống")
    String variantId;

    @NotBlank(message = "batchNumber không được trống")
    String batchNumber;

    @NotNull(message = "manufactureDate không được trống")
    LocalDate manufactureDate;

    @NotNull(message = "expiryDate không được trống")
    @Future(message = "expiryDate phải sau ngày hôm nay")
    LocalDate expiryDate;

    @NotNull
    @DecimalMin(value = "0.01", message = "importPrice phải lớn hơn 0")
    BigDecimal importPrice;

    @Min(value = 1, message = "quantity phải lớn hơn 0")
    int quantity;

    @Min(value = 0, message = "lowStockThreshold không được âm")
    Integer lowStockThreshold;
}
