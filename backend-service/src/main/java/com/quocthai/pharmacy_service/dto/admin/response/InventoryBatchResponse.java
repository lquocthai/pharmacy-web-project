package com.quocthai.pharmacy_service.dto.admin.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryBatchResponse {

    String id;
    String variantId;
    String productId;
    String productName;
    String variantName;
    String sku;
    String batchNumber;
    LocalDate expiryDate;
    LocalDate manufactureDate;
    BigDecimal importPrice;
    Integer remainingQuantity;
    Integer lowStockThreshold;
    LocalDateTime lastStockUpdate;

    /** Tiện lợi cho UI: cho biết lô này có đang cảnh báo tồn thấp không */
    boolean lowStockAlert;
}
