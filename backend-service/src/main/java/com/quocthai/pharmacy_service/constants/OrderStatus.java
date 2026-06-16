package com.quocthai.pharmacy_service.constants;

public enum OrderStatus {
    PENDING,    // Chờ xác nhận
    CONFIRMED,  // Đã xác nhận
    SHIPPING,   // Đang giao hàng
    DELIVERED,  // Đã giao
    CANCELLED   // Đã hủy
}
