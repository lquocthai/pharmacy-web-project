package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.constants.OrderStatus;
import com.quocthai.pharmacy_service.dto.admin.response.AdminDashboardResponse;
import com.quocthai.pharmacy_service.repository.OrderRepository;
import com.quocthai.pharmacy_service.repository.ProductRepository;
import com.quocthai.pharmacy_service.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminDashboardService {

    OrderRepository orderRepository;
    UserRepository userRepository;
    ProductRepository productRepository;

    private static final DateTimeFormatter DAY_FORMATTER = DateTimeFormatter.ofPattern("dd/MM");

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {

        LocalDate today = LocalDate.now();
        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime startOfTomorrow = today.plusDays(1).atStartOfDay();

        // ── Tổng quan ──────────────────────────────────────────────────────
        long totalOrders       = orderRepository.count();
        long todayOrders       = orderRepository.countTodayOrders(startOfToday, startOfTomorrow);
        BigDecimal totalRevenue  = orderRepository.sumTotalRevenue();
        BigDecimal todayRevenue  = orderRepository.sumTodayRevenue(startOfToday, startOfTomorrow);
        long totalCustomers    = userRepository.countByActiveTrue();

        long totalProducts     = productRepository.count();
        long activeProducts    = productRepository.countByActiveTrue();

        // ── Đơn hàng theo trạng thái ───────────────────────────────────────
        long pendingOrders   = orderRepository.countByStatus(OrderStatus.PENDING);
        long confirmedOrders = orderRepository.countByStatus(OrderStatus.CONFIRMED);
        long shippingOrders  = orderRepository.countByStatus(OrderStatus.SHIPPING);
        long deliveredOrders = orderRepository.countByStatus(OrderStatus.DELIVERED);
        long cancelledOrders = orderRepository.countByStatus(OrderStatus.CANCELLED);

        // ── Biểu đồ 7 ngày ────────────────────────────────────────────────
        LocalDateTime from7Days = today.minusDays(6).atStartOfDay();

        List<AdminDashboardResponse.DailyRevenueItem> revenueChart =
                buildRevenueChart(from7Days, startOfTomorrow);

        List<AdminDashboardResponse.DailyOrderItem> orderChart =
                buildOrderChart(from7Days, startOfTomorrow);

        // ── Top sản phẩm bán chạy (top 5) ────────────────────────────────
        List<AdminDashboardResponse.TopProductItem> topProducts =
                orderRepository.getTopProducts(PageRequest.of(0, 5))
                        .stream()
                        .map(row -> AdminDashboardResponse.TopProductItem.builder()
                                .productName((String) row[0])
                                .soldQuantity(((Number) row[1]).longValue())
                                .revenue((BigDecimal) row[2])
                                .build())
                        .toList();

        return AdminDashboardResponse.builder()
                .totalOrders(totalOrders)
                .todayOrders(todayOrders)
                .totalRevenue(totalRevenue)
                .todayRevenue(todayRevenue)
                .totalCustomers(totalCustomers)

                .totalProducts(totalProducts)
                .activeProducts(activeProducts)
                .pendingOrders(pendingOrders)
                .confirmedOrders(confirmedOrders)
                .shippingOrders(shippingOrders)
                .deliveredOrders(deliveredOrders)
                .cancelledOrders(cancelledOrders)
                .revenueChart(revenueChart)
                .orderChart(orderChart)
                .topProducts(topProducts)
                .build();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private List<AdminDashboardResponse.DailyRevenueItem> buildRevenueChart(
            LocalDateTime from, LocalDateTime to) {

        // Build map date -> revenue từ DB
        Map<String, BigDecimal> dbMap = new LinkedHashMap<>();
        orderRepository.getDailyRevenue(from, to).forEach(row -> {
            String date = formatDate(row[0]);
            BigDecimal revenue = (BigDecimal) row[1];
            dbMap.put(date, revenue);
        });

        // Fill đủ 7 ngày (kể cả ngày không có đơn = 0)
        List<AdminDashboardResponse.DailyRevenueItem> result = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            String label = LocalDate.now().minusDays(i).format(DAY_FORMATTER);
            result.add(AdminDashboardResponse.DailyRevenueItem.builder()
                    .date(label)
                    .revenue(dbMap.getOrDefault(label, BigDecimal.ZERO))
                    .build());
        }
        return result;
    }

    private List<AdminDashboardResponse.DailyOrderItem> buildOrderChart(
            LocalDateTime from, LocalDateTime to) {

        Map<String, Long> dbMap = new LinkedHashMap<>();
        orderRepository.getDailyOrderCount(from, to).forEach(row -> {
            String date = formatDate(row[0]);
            long count = ((Number) row[1]).longValue();
            dbMap.put(date, count);
        });

        List<AdminDashboardResponse.DailyOrderItem> result = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            String label = LocalDate.now().minusDays(i).format(DAY_FORMATTER);
            result.add(AdminDashboardResponse.DailyOrderItem.builder()
                    .date(label)
                    .count(dbMap.getOrDefault(label, 0L))
                    .build());
        }
        return result;
    }

    /**
     * MySQL FUNCTION('DATE', ...) trả về java.sql.Date hoặc LocalDate tùy driver.
     * Xử lý an toàn cả hai trường hợp.
     */
    private String formatDate(Object dateObj) {
        if (dateObj instanceof java.sql.Date sqlDate) {
            return sqlDate.toLocalDate().format(DAY_FORMATTER);
        }
        if (dateObj instanceof LocalDate localDate) {
            return localDate.format(DAY_FORMATTER);
        }
        return dateObj.toString();
    }
}
