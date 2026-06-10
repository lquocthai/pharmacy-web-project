package com.quocthai.pharmacy_service.dto.admin.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminDashboardResponse {

    // ── Tổng quan ──────────────────────────────────────────────────────────
    long totalOrders;
    long todayOrders;
    BigDecimal totalRevenue;
    BigDecimal todayRevenue;
    long totalCustomers;
    long totalProducts;
    long activeProducts;

    // ── Đơn hàng theo trạng thái ───────────────────────────────────────────
    long pendingOrders;
    long confirmedOrders;
    long shippingOrders;
    long deliveredOrders;
    long cancelledOrders;

    // ── Doanh thu 7 ngày gần nhất ──────────────────────────────────────────
    List<DailyRevenueItem> revenueChart;

    // ── Đơn hàng 7 ngày gần nhất ───────────────────────────────────────────
    List<DailyOrderItem> orderChart;

    // ── Top sản phẩm bán chạy ──────────────────────────────────────────────
    List<TopProductItem> topProducts;

    // ── Inner DTOs ─────────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyRevenueItem {
        String date;          // "dd/MM"
        BigDecimal revenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyOrderItem {
        String date;          // "dd/MM"
        long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopProductItem {
        String productName;
        String imageUrl;
        long soldQuantity;
        BigDecimal revenue;
    }
}
