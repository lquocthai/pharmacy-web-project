package com.quocthai.pharmacy_service.dto.admin.response;

import com.quocthai.pharmacy_service.constants.InventoryTransactionType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryTransactionResponse {

    String id;
    InventoryTransactionType type;
    String variantId;
    String productName;
    String variantName;
    String sku;
    String batchId;
    String batchNumber;
    Integer quantity;
    String referenceId;
    LocalDateTime createdAt;
}
