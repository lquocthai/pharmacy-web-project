package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.constants.OrderStatus;
import com.quocthai.pharmacy_service.constants.PaymentMethod;
import com.quocthai.pharmacy_service.constants.PaymentStatus;
import com.quocthai.pharmacy_service.dto.admin.request.UpdateOrderStatusRequest;
import com.quocthai.pharmacy_service.dto.admin.response.AdminOrderResponse;
import com.quocthai.pharmacy_service.dto.request.CancelOrderRequest;
import com.quocthai.pharmacy_service.dto.request.CreateOrderRequest;
import com.quocthai.pharmacy_service.dto.request.OrderItemRequest;
import com.quocthai.pharmacy_service.dto.response.*;
import com.quocthai.pharmacy_service.entity.*;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.mapper.AdminOrderMapper;
import com.quocthai.pharmacy_service.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderService {

    OrderRepository orderRepository;
    OrderItemRepository orderItemRepository;
    OrderStatusHistoryRepository orderStatusHistoryRepository;
    CartRepository cartRepository;
    CartItemRepository cartItemRepository;
    UserRepository userRepository;
    UserAddressRepository userAddressRepository;
    InventoryBatchRepository inventoryRepository;
    ProductVariantRepository productVariantRepository;
    ProductImageRepository productImageRepository;
    ProductRepository productRepository;
    InventoryAllocationRepository inventoryAllocationRepository;
    // ── Phí vận chuyển cố định (có thể mở rộng sau) ──────────────────────────
    private static final BigDecimal SHIPPING_FEE = BigDecimal.valueOf(30_000);
    private static final Random RD = new Random();
    private final AdminOrderMapper adminOrderMapper;


    // ── Lấy email từ JWT ──────────────────────────────────────────────────────
    private String getCurrentUserEmail() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return auth.getName();
    }

    // ── Generate mã đơn hàng duy nhất ─────────────────────────────────────────
    private String generateOrderCode() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = String.format("%04d", RD.nextInt(10000));
        String code = "QT-" + date + "-" + random;
        // Đảm bảo không trùng
        while (orderRepository.existsByOrderCode(code)) {
            random = String.format("%04d", RD.nextInt(10000));
            code = "QT-" + date + "-" + random;
        }
        return code;
    }

    // ── Map Order → OrderResponse (không có items/history) ───────────────────
    private OrderResponse toResponse(Order order,
                                     List<OrderItemResponse> items,
                                     List<OrderStatusHistoryResponse> history) {
        String fullAddress = order.getShippingAddressDetail()
                + ", " + order.getShippingWard()
                + ", " + order.getShippingDistrict()
                + ", " + order.getShippingProvince();

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .totalAmount(order.getTotalAmount())
                .shippingFee(order.getShippingFee())
                .finalAmount(order.getFinalAmount())
                .productCount(order.getProductCount())
                .note(order.getNote())
                .shippingFullName(order.getShippingFullName())
                .shippingPhone(order.getShippingPhone())
                .shippingProvince(order.getShippingProvince())
                .shippingDistrict(order.getShippingDistrict())
                .shippingWard(order.getShippingWard())
                .shippingAddressDetail(order.getShippingAddressDetail())
                .shippingFullAddress(fullAddress)
                .items(items)
                .statusHistory(history)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .cancelledAt(order.getCancelledAt())
                .cancelReason(order.getCancelReason())
                .paymentTransactionId(order.getPaymentTransactionId())
                .paidAt(order.getPaidAt())
                .build();
    }

    private OrderItemResponse toItemResponse(OrderItem oi) {
        return OrderItemResponse.builder()
                .id(oi.getId())
                .productId(oi.getProduct() != null ? oi.getProduct().getId() : null)
                .productName(oi.getProductName())
                .productSlug(oi.getProductSlug())
                .variantId(oi.getVariant() != null ? oi.getVariant().getId() : null)
                .variantName(oi.getVariantName())
                .sku(oi.getSku())
                .imageUrl(oi.getImageUrl())
                .quantity(oi.getQuantity())
                .priceAtTime(oi.getPriceAtTime())
                .subtotal(oi.getSubtotal())
                .build();
    }

    private OrderStatusHistoryResponse toHistoryResponse(OrderStatusHistory h) {
        return OrderStatusHistoryResponse.builder()
                .id(h.getId())
                .status(h.getStatus())
                .note(h.getNote())
                .changedBy(h.getChangedBy())
                .changedAt(h.getChangedAt())
                .build();
    }

    // ── THUẬT TOÁN TRỪ KHO THEO LÔ FIFO (REAL-TIME NĂM 2026) ───────────────────
    private List<InventoryAllocation> deductInventoryFIFO(OrderItem orderItem) {
        String variantId = orderItem.getVariant().getId();
        int quantityNeeded = orderItem.getQuantity();
        List<InventoryBatch> batches =
                inventoryRepository.findAvailableBatchesByVariantId(
                        variantId,
                        LocalDate.now()
                );
        List<InventoryAllocation> allocations =
                new ArrayList<>();
        int remainingToDeduct = quantityNeeded;
        for (InventoryBatch batch : batches) {
            if (remainingToDeduct <= 0) {
                break;
            }
            int stock = batch.getRemainingQuantity();
            if (stock <= 0) {
                continue;
            }

            int deductAmount =
                    Math.min(stock, remainingToDeduct);

            batch.setRemainingQuantity(
                    stock - deductAmount
            );

            remainingToDeduct -= deductAmount;

            allocations.add(
                    InventoryAllocation.builder()
                            .orderItem(orderItem)
                            .batch(batch)
                            .quantity(deductAmount)
                            .build()
            );
        }

        if (remainingToDeduct > 0) {
            throw new AppException(
                    ErrorCode.INSUFFICIENT_STOCK
            );
        }

        inventoryRepository.saveAll(batches);

        return allocations;
    }

    // ── HOÀN LẠI TỒN KHO KHI HỦY ĐƠN (QUAY LẠI LÔ GỐC) ─────────────────────────
    // sẽ phát triển sau
    private void restoreInventory(List<OrderItem> items) {
        for (OrderItem item : items) {
            if (item.getVariant() == null) continue;

            List<InventoryBatch> batches = inventoryRepository.findAvailableBatchesByVariantId(item.getVariant().getId(), LocalDate.now());

            if (!batches.isEmpty()) {
                // Hoàn trả số lượng vào lô có hạn xa nhất hoặc lô đầu tiên để tái khả dụng nhanh
                InventoryBatch targetBatch = batches.getFirst();
                targetBatch.setRemainingQuantity(targetBatch.getRemainingQuantity() + item.getQuantity());
                inventoryRepository.save(targetBatch);
            }
        }
    }

    // ================= POST /orders — ĐẶT HÀNG SKU MỚI =================
    @Transactional
    public OrderResponse placeOrder(CreateOrderRequest request) {
        String email = getCurrentUserEmail();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // 1. Validate địa chỉ
        UserAddress address = userAddressRepository
                .findOwnedAddress(request.getAddressId(), email)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_EXISTED));

        // 2. Gom danh sách variantId từ client gửi lên
        List<String> variantIds = request.getItems().stream()
                .map(OrderItemRequest::getVariantId)
                .distinct()
                .toList();

        // 3. Query hàng loạt thông tin Phân loại (Variants) để lấy giá, thông tin gốc
        List<ProductVariant> variants = productVariantRepository.findAllById(variantIds);
        if (variants.size() != variantIds.size()) {
            throw new AppException(ErrorCode.PRODUCT_NOT_EXISTED);
        }

        Map<String, ProductVariant> variantMap = variants.stream()
                .collect(Collectors.toMap(ProductVariant::getId, v -> v));

        // 4. Validate tồn kho tổng hợp từ các Lô (Batch) còn hạn khả dụng
        Map<String, Integer> stockMap = inventoryRepository.getStockMapByVariantIds(variantIds, LocalDate.now())
                .stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> ((Number) row[1]).intValue()
                ));

        for (OrderItemRequest itemReq : request.getItems()) {
            int availableStock = stockMap.getOrDefault(itemReq.getVariantId(), 0);
            if (availableStock < itemReq.getQuantity()) {
                throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
            }
        }

        // 5. Build cấu trúc Order Items + Chụp ảnh Snapshot dữ liệu tại thời điểm đặt thuốc
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal calculatedTotal = BigDecimal.ZERO;

        for (OrderItemRequest itemRequest : request.getItems()) {
            ProductVariant variant = variantMap.get(itemRequest.getVariantId());
            Product product = variant.getProduct(); // Lấy thông tin sản phẩm cha để làm snapshot

            BigDecimal price = variant.getPrice();
            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
            calculatedTotal = calculatedTotal.add(subtotal);

            // Gán đầy đủ thông tin Snapshot ngăn lỗi vỡ hóa đơn lịch sử sau này
            OrderItem orderItem = OrderItem.builder()
                    .variant(variant)
                    .product(product)
                    .productName(product.getName())
                    .variantName(variant.getVariantName()) // Lưu snapshot tên phân loại (Ví dụ: Vỉ 10 viên)
                    .sku(variant.getSku())                 // Lưu mã SKU xuất kho
                    .productSlug(product.getSlug())
                    .imageUrl(itemRequest.getImageUrl())
                    .quantity(itemRequest.getQuantity())
                    .priceAtTime(price)
                    .subtotal(subtotal)
                    .build();

            orderItems.add(orderItem);
        }

        // 6. Xác minh khớp tổng tiền hệ thống tính toán và client hiển thị
        if (calculatedTotal.compareTo(request.getTotalAmount()) != 0) {
            throw new AppException(ErrorCode.INVALID_ORDER_AMOUNT);
        }
        // sau này có thể sửa backend tự tính phí shipping k trust thông tin phí từ frontend tuyệt đối
        BigDecimal shippingFee = request.getShippingFee();
        BigDecimal finalAmount = calculatedTotal.add(shippingFee);

        // 7. Lưu bản ghi Order tổng quát
        Order order = Order.builder()
                .orderCode(generateOrderCode())
                .user(user)
                .status(OrderStatus.PENDING)
                .paymentMethod(PaymentMethod.valueOf(request.getPaymentMethod()))
                .paymentStatus(PaymentStatus.UNPAID)
                .totalAmount(calculatedTotal)
                .shippingFee(shippingFee)
                .finalAmount(finalAmount)
                .productCount(orderItems.size())
                .note(request.getNote())

                // Snapshot địa chỉ giao nhận thuốc tại chỗ
                .shippingFullName(address.getFullName())
                .shippingPhone(address.getPhone())
                .shippingProvince(address.getProvince())
                .shippingDistrict(address.getDistrict())
                .shippingWard(address.getWard())
                .shippingAddressDetail(address.getAddressDetail())
                .build();

        orderRepository.save(order);

        // 8. Đóng kết nối khóa ngoại items vào Order cha và lưu hàng loạt
        orderItems.forEach(item -> item.setOrder(order));
        orderItemRepository.saveAll(orderItems);

        // 9. Thực thi trừ kho Lô theo thuật toán FIFO cấu hình hạn dùng tăng dần
        List<InventoryAllocation> allocations =
                new ArrayList<>();

        for (OrderItem item : orderItems) {

            allocations.addAll(
                    deductInventoryFIFO(item)
            );
        }
        inventoryAllocationRepository.saveAll(
                allocations
        );


        // 10. Tạo bản ghi Audit Log tiến trình đơn hàng trước tiên
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .status(OrderStatus.PENDING)
                .note("Đơn hàng được tạo thành công trên hệ thống")
                .changedBy(email)
                .build();
        orderStatusHistoryRepository.save(history);

        // 11. Dọn dẹp sạch sẽ các mặt hàng SKU vừa mua ra khỏi giỏ hàng (Cart) của User
        cartItemRepository.deleteSelectedVariants(user.getId(), variantIds);

        // 12. Tập hợp dữ liệu trả kết quả về Frontend
        List<OrderItemResponse> itemResponses = orderItems.stream()
                .map(this::toItemResponse)
                .toList();

        List<OrderStatusHistoryResponse> historyResponses = List.of(toHistoryResponse(history));

        return toResponse(order, itemResponses, historyResponses);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GET /orders — Lịch sử đơn hàng ( lọc status)
    // ═══════════════════════════════════════════════════════════════════════════
    // ================= GET /orders — XEM LỊCH SỬ MUA HÀNG =================
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(OrderStatus status) {
        String email = getCurrentUserEmail();

        List<Order> orders = orderRepository.findByUserEmail(email, status);
        if (orders.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> orderIds = orders.stream().map(Order::getId).toList();

        List<OrderItem> allItems = orderItemRepository.findByOrderIds(orderIds);
        Map<String, List<OrderItemResponse>> itemMap = allItems.stream()
                .collect(Collectors.groupingBy(
                        oi -> oi.getOrder().getId(),
                        Collectors.mapping(this::toItemResponse, Collectors.toList())
                ));

        List<OrderStatusHistory> allHistory = orderStatusHistoryRepository.findByOrderIds(orderIds);
        Map<String, List<OrderStatusHistoryResponse>> historyMap = allHistory.stream()
                .collect(Collectors.groupingBy(
                        h -> h.getOrder().getId(),
                        Collectors.mapping(this::toHistoryResponse, Collectors.toList())
                ));

        return orders.stream()
                .map(o -> toResponse(
                        o,
                        itemMap.getOrDefault(o.getId(), Collections.emptyList()),
                        historyMap.getOrDefault(o.getId(), Collections.emptyList())
                ))
                .toList();
    }
    /**
     * Lấy đơn hàng theo orderCode
     * Dùng cho VNPay payment result page
     */
    @Transactional(readOnly = true)
    public OrderResponse getByOrderCode(String orderCode) {

        Order order = orderRepository
                .findByOrderCode(orderCode)
                .orElseThrow(() ->
                        new AppException(ErrorCode.ORDER_NOT_EXISTED)
                );

        List<OrderItemResponse> items =
                orderItemRepository.findByOrderId(order.getId())
                        .stream()
                        .map(this::toItemResponse)
                        .toList();

        List<OrderStatusHistoryResponse> history =
                orderStatusHistoryRepository.findByOrderId(order.getId())
                        .stream()
                        .map(this::toHistoryResponse)
                        .toList();

        return toResponse(
                order,
                items,
                history
        );
    }


    // ═══════════════════════════════════════════════════════════════════════════
    // GET /orders/{orderId} — Chi tiết 1 đơn hàng
    // ═══════════════════════════════════════════════════════════════════════════
    @Transactional(readOnly = true)
    public OrderResponse getOrderDetailByCode(String orderCode) {
        String email = getCurrentUserEmail();

        Order order = orderRepository.findByOrderCodeAndUserEmail(orderCode, email)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));

        String orderId = order.getId();

        List<OrderItemResponse> items = orderItemRepository.findByOrderId(orderId)
                .stream().map(this::toItemResponse).toList();

        List<OrderStatusHistoryResponse> history = orderStatusHistoryRepository.findByOrderId(orderId)
                .stream().map(this::toHistoryResponse).toList();

        return toResponse(order, items, history);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GET /orders/{orderId}/tracking — Lịch sử trạng thái (track order)
    // ═══════════════════════════════════════════════════════════════════════════
    @Transactional(readOnly = true)
    public List<OrderStatusHistoryResponse> getOrderTracking(String orderId) {
        String email = getCurrentUserEmail();

        // Ownership check
        orderRepository.findByIdAndUserEmail(orderId, email)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));

        return orderStatusHistoryRepository.findByOrderId(orderId)
                .stream().map(this::toHistoryResponse).toList();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PATCH /orders/{orderId}/cancel — Hủy đơn hàng
    // ═══════════════════════════════════════════════════════════════════════════
    @Transactional
    public OrderResponse cancelOrder(String orderId, CancelOrderRequest request) {
        String email = getCurrentUserEmail();

        Order order = orderRepository.findByIdAndUserEmail(orderId, email)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));

        // Chỉ cho hủy khi PENDING
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new AppException(ErrorCode.ORDER_CANNOT_CANCEL);
        }

        // Cập nhật trạng thái
        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        order.setCancelReason(request.getCancelReason());

        // Hoàn lại tồn kho
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        restoreInventory(items);

        // Tạo bản ghi lịch sử
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .status(OrderStatus.CANCELLED)
                .note(request.getCancelReason() != null
                        ? "Hủy đơn: " + request.getCancelReason()
                        : "Khách hàng hủy đơn")
                .changedBy(email)
                .build();
        orderStatusHistoryRepository.save(history);

        // Build response
        List<OrderItemResponse> itemResponses = items.stream().map(this::toItemResponse).toList();
        List<OrderStatusHistoryResponse> historyResponses = orderStatusHistoryRepository
                .findByOrderId(orderId).stream().map(this::toHistoryResponse).toList();

        return toResponse(order, itemResponses, historyResponses);
    }
    // admin
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<AdminOrderResponse> getOrders(
            int page,
            int size,
            String keyword,
            OrderStatus status,
            PaymentStatus paymentStatus
    ) {

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<Order> orders = orderRepository.searchOrders(
                keyword,
                status,
                paymentStatus,
                pageable
        );

        List<AdminOrderResponse> content = orders.getContent()
                .stream()
                .map(adminOrderMapper::toAdminOrderResponse)
                .toList();

        return PageResponse.<AdminOrderResponse>builder()
                .content(content)
                .page(orders.getNumber())
                .size(orders.getSize())
                .totalElements(orders.getTotalElements())
                .totalPages(orders.getTotalPages())
                .last(orders.isLast())
                .build();
    }
    // update status order
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void updateStatus(
            String orderId,
            UpdateOrderStatusRequest request
    ) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new AppException(ErrorCode.ORDER_NOT_EXISTED));

        validateStatusTransition(
                order.getStatus(),
                request.getStatus()
        );

        order.setStatus(request.getStatus());

        if (request.getStatus() == OrderStatus.CANCELLED) {
            order.setCancelledAt(LocalDateTime.now());
            order.setCancelReason(request.getNote());
        }
        String adminEmail = getCurrentUserEmail();
        OrderStatusHistory history =
                OrderStatusHistory.builder()
                        .order(order)
                        .status(request.getStatus())
                        .note(request.getNote())
                        .changedBy(adminEmail)
                        .build();

        orderStatusHistoryRepository.save(history);
    }
    // cancel order admin
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void cancelOrderByAdmin(
            String orderId,
            CancelOrderRequest request
    ) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new AppException(ErrorCode.ORDER_NOT_EXISTED));
        if (order.getStatus() == OrderStatus.SHIPPING) {
            throw new AppException(ErrorCode.ORDER_CANNOT_CANCEL);
        }

        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new AppException(ErrorCode.ORDER_CANNOT_CANCEL);
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.ORDER_ALREADY_CANCELLED);
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        order.setCancelReason(request.getCancelReason());

        String adminEmail = getCurrentUserEmail();

        OrderStatusHistory history =
                OrderStatusHistory.builder()
                        .order(order)
                        .status(OrderStatus.CANCELLED)
                        .note(request.getCancelReason())
                        .changedBy(adminEmail)
                        .build();

        orderStatusHistoryRepository.save(history);
    }
    // xem lịch sử đơn hàng
    @PreAuthorize("hasRole('ADMIN')")
    public List<OrderStatusHistoryResponse> getOrderHistory(String orderId) {
        if (!orderRepository.existsById(orderId)) {
            throw new AppException(
                    ErrorCode.ORDER_NOT_EXISTED
            );
        }
        return orderStatusHistoryRepository.findByOrderId(orderId)
                .stream().map(this::toHistoryResponse).toList();
    }
    // validate status tránh cập nhật lộn xộn (validate theo business rule)
    private void validateStatusTransition(
            OrderStatus current,
            OrderStatus next
    ) {
        if (current == next) {
            throw new AppException(
                    ErrorCode.INVALID_ORDER_STATUS
            );
        }
        switch (current) {
            case PENDING -> {
                if (next != OrderStatus.CONFIRMED
                        && next != OrderStatus.CANCELLED) {
                    throw new AppException(
                            ErrorCode.INVALID_ORDER_STATUS
                    );
                }
            }

            case CONFIRMED -> {
                if (next != OrderStatus.SHIPPING
                        && next != OrderStatus.CANCELLED) {
                    throw new AppException(
                            ErrorCode.INVALID_ORDER_STATUS
                    );
                }
            }

            case SHIPPING -> {
                if (next != OrderStatus.DELIVERED) {
                    throw new AppException(
                            ErrorCode.INVALID_ORDER_STATUS
                    );
                }
            }

            case DELIVERED, CANCELLED -> {
                throw new AppException(
                        ErrorCode.INVALID_ORDER_STATUS
                );
            }
        }
    }
}
