package com.quocthai.pharmacy_service.dto.admin.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryDashboardResponse {

    /** Tổng số variant đang có trong hệ thống */
    long totalVariants;

    /** Tổng số lô hàng (tất cả trạng thái) */
    long totalBatches;

    /** Tổng tồn kho khả dụng (chưa hết hạn, còn hàng) */
    long totalStock;

    /** Số lô đang ở mức tồn thấp (remainingQuantity <= lowStockThreshold) */
    long lowStockBatches;

    /** Số lô sắp hết hạn trong 90 ngày tới */
    long expiringBatches;

    /** Số variant hiện tại hết hàng hoàn toàn (tổng tồn = 0) */
    long outOfStockVariants;
}
