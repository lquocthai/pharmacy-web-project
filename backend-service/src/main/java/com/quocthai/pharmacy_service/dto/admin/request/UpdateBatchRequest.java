package com.quocthai.pharmacy_service.dto.admin.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateBatchRequest {

    @NotNull(message = "expiryDate không được trống")
    @Future(message = "expiryDate phải sau ngày hôm nay")
    LocalDate expiryDate;

    LocalDate manufactureDate;

    @Min(value = 0, message = "lowStockThreshold không được âm")
    Integer lowStockThreshold;
}
