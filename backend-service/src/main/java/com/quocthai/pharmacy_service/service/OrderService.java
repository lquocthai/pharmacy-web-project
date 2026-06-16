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
import com.quocthai.pharmacy_service.service.InventoryService.AllocateResult;
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
    CartItemRepository cartItemRepository;
    UserRepository userRepository;
    UserAddressRepository userAddressRepository;
    InventoryBatchRepository inventoryBatchRepository;
    ProductVariantRepository productVariantRepository;
    InventoryAllocationRepository allocationRepository;
    InventoryTransactionRepository transactionRepository;
    InventoryService inventoryService;
    AdminOrderMapper adminOrderMapper;

    private static final BigDecimal SHIPPING_FEE = BigDecimal.valueOf(30_000);
    private static final Random RD = new Random();

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private String getCurrentUserEmail() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return auth.getName();
    }

    /** Sinh mã đơn hàng duy nhất, loop cho đến khi không trùng */
    private String generateOrderCode() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String code;
        do {
            code = "QT-" + date + "-" + String.format("%04d", RD.nextInt(10_000));
        } while (orderRepository.existsByOrderCode(code));
        return code;
    }

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

    // ─────────────────────────────────────────────────────────────────────────
    // ĐẶT HÀNG — POST /orders
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Luồng:
     * 1. Validate user + địa chỉ
     * 2. Load variants (1 query)
     * 3. Validate tồn kho tổng hợp (1 query aggregation)
     * 4. Build OrderItems + tính tiền
     * 5. Verify tổng tiền với client
     * 6. Save Order → save OrderItems
     * 7. Xuất kho FEFO + PESSIMISTIC_WRITE (InventoryService)
     * 8. Save allocations + transaction logs (saveAll)
     * 9. Save status history
     * 10. Xóa cart items
     *
     * Nếu bất kỳ bước nào throw exception → toàn bộ transaction rollback.
     */
    @Transactional
    public OrderResponse placeOrder(CreateOrderRequest request) {
        String email = getCurrentUserEmail();

        // 1. Validate user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // 2. Validate địa chỉ — ownership check trong query
        UserAddress address = userAddressRepository
                .findOwnedAddress(request.getAddressId(), email)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_EXISTED));

        // 3. Load tất cả variant trong 1 query
        List<String> variantIds = request.getItems().stream()
                .map(OrderItemRequest::getVariantId)
                .distinct()
                .toList();

        List<ProductVariant> variants = productVariantRepository.findAllById(variantIds);
        if (variants.size() != variantIds.size()) {
            throw new AppException(ErrorCode.PRODUCT_NOT_EXISTED);
        }

        Map<String, ProductVariant> variantMap = variants.stream()
                .collect(Collectors.toMap(ProductVariant::getId, v -> v));

        // 4. Validate active status
        for (ProductVariant v : variants) {
            if (!v.isActive()) {
                throw new AppException(ErrorCode.PRODUCT_UNAVAILABLE);
            }
        }

        // 5. Validate tồn kho tổng hợp (1 aggregation query, không load batch)
        //    Đây là pre-check nhanh để fail-fast trước khi lấy lock.
        //    Lock thực sự chống oversell nằm ở bước FEFO trong InventoryService.
        Map<String, Integer> stockMap = inventoryBatchRepository
                .getStockMapByVariantIds(variantIds, LocalDate.now())
                .stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> ((Number) row[1]).intValue()
                ));

        for (OrderItemRequest itemReq : request.getItems()) {
            int available = stockMap.getOrDefault(itemReq.getVariantId(), 0);
            if (available < itemReq.getQuantity()) {
                throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
            }
        }

        // 6. Build OrderItems + tính tổng tiền
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal calculatedTotal = BigDecimal.ZERO;

        for (OrderItemRequest itemReq : request.getItems()) {
            ProductVariant variant = variantMap.get(itemReq.getVariantId());
            Product product = variant.getProduct();

            BigDecimal price = variant.getPrice();
            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            calculatedTotal = calculatedTotal.add(subtotal);

            orderItems.add(OrderItem.builder()
                    .variant(variant)
                    .product(product)
                    .productName(product.getName())
                    .variantName(variant.getVariantName())
                    .sku(variant.getSku())
                    .productSlug(product.getSlug())
                    .imageUrl(itemReq.getImageUrl())
                    .quantity(itemReq.getQuantity())
                    .priceAtTime(price)
                    .subtotal(subtotal)
                    .build());
        }

        // 7. Verify tổng tiền (backend kiểm soát, không trust client)
        if (calculatedTotal.compareTo(request.getTotalAmount()) != 0) {
            throw new AppException(ErrorCode.INVALID_ORDER_AMOUNT);
        }

        BigDecimal shippingFee = SHIPPING_FEE; // backend tự tính, không trust client
        BigDecimal finalAmount = calculatedTotal.add(shippingFee);

        // 8. Save Order
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
                .shippingFullName(address.getFullName())
                .shippingPhone(address.getPhone())
                .shippingProvince(address.getProvince())
                .shippingDistrict(address.getDistrict())
                .shippingWard(address.getWard())
                .shippingAddressDetail(address.getAddressDetail())
                .build();

        orderRepository.save(order);

        // 9. Gắn order vào items và save hàng loạt
        orderItems.forEach(item -> item.setOrder(order));
        orderItemRepository.saveAll(orderItems);

        // 10. Xuất kho FEFO + PESSIMISTIC_WRITE — chống oversell
        AllocateResult result = inventoryService.allocateStock(orderItems, order.getId());

        // 11. Save allocations + audit logs (saveAll — không save trong loop)
        allocationRepository.saveAll(result.allocations());
        transactionRepository.saveAll(result.txLogs());

        // 12. Save status history
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .status(OrderStatus.PENDING)
                .note("Đơn hàng được tạo thành công")
                .changedBy(email)
                .build();
        orderStatusHistoryRepository.save(history);

        // 13. Xóa cart items đã mua
        cartItemRepository.deleteSelectedVariants(user.getId(), variantIds);

        // 14. Build response
        List<OrderItemResponse> itemResponses = orderItems.stream()
                .map(this::toItemResponse)
                .toList();

        return toResponse(order, itemResponses, List.of(toHistoryResponse(history)));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HỦY ĐƠN (USER) — PATCH /orders/{id}/cancel
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Chỉ cho hủy khi PENDING.
     * Hoàn kho đúng batch gốc qua InventoryAllocation.
     * Tạo audit log RETURN.
     */
    @Transactional
    public OrderResponse cancelOrder(String orderId, CancelOrderRequest request) {
        String email = getCurrentUserEmail();

        Order order = orderRepository.findByIdAndUserEmail(orderId, email)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));
        if(order.getStatus() == OrderStatus.CANCELLED){
            throw new AppException(ErrorCode.ORDER_ALREADY_CANCELLED);
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new AppException(ErrorCode.ORDER_CANNOT_CANCEL);
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        order.setCancelReason(request.getCancelReason());

        // Hoàn kho đúng batch gốc
        inventoryService.restoreStock(orderId);

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .status(OrderStatus.CANCELLED)
                .note(request.getCancelReason() != null
                        ? "Hủy đơn: " + request.getCancelReason()
                        : "Khách hàng hủy đơn")
                .changedBy(email)
                .build();
        orderStatusHistoryRepository.save(history);

        List<OrderItemResponse> itemResponses = orderItemRepository.findByOrderId(orderId)
                .stream().map(this::toItemResponse).toList();
        List<OrderStatusHistoryResponse> historyResponses = orderStatusHistoryRepository
                .findByOrderId(orderId).stream().map(this::toHistoryResponse).toList();

        return toResponse(order, itemResponses, historyResponses);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HỦY ĐƠN (ADMIN)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void cancelOrderByAdmin(String orderId, CancelOrderRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));


        if (order.getStatus() == OrderStatus.SHIPPING
                || order.getStatus() == OrderStatus.DELIVERED) {
            throw new AppException(ErrorCode.ORDER_CANNOT_CANCEL);
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.ORDER_ALREADY_CANCELLED);
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        order.setCancelReason(request.getCancelReason());

        // Hoàn kho đúng batch gốc — giống user cancel
        inventoryService.restoreStock(orderId);

        String adminEmail = getCurrentUserEmail();
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .status(OrderStatus.CANCELLED)
                .note(request.getCancelReason())
                .changedBy(adminEmail)
                .build();
        orderStatusHistoryRepository.save(history);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CẬP NHẬT TRẠNG THÁI (ADMIN)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void updateStatus(String orderId, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));

        validateStatusTransition(order.getStatus(), request.getStatus());

        order.setStatus(request.getStatus());

        if (request.getStatus() == OrderStatus.CANCELLED) {
            order.setCancelledAt(LocalDateTime.now());
            order.setCancelReason(request.getNote());
            // Hoàn kho khi admin cancel qua updateStatus
            inventoryService.restoreStock(orderId);
        }

        String adminEmail = getCurrentUserEmail();
        if(request.getStatus().equals(OrderStatus.DELIVERED)){
            order.setPaymentStatus(PaymentStatus.PAID);
            orderRepository.save(order);
        }
        orderStatusHistoryRepository.save(OrderStatusHistory.builder()
                .order(order)
                .status(request.getStatus())
                .note(request.getNote())
                .changedBy(adminEmail)
                .build());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // READ — GET /orders
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(OrderStatus status) {
        String email = getCurrentUserEmail();

        List<Order> orders = orderRepository.findByUserEmail(email, status);
        if (orders.isEmpty()) return Collections.emptyList();

        List<String> orderIds = orders.stream().map(Order::getId).toList();

        // Tránh N+1: load items + history bằng 2 query IN clause
        Map<String, List<OrderItemResponse>> itemMap = orderItemRepository
                .findByOrderIds(orderIds).stream()
                .collect(Collectors.groupingBy(
                        oi -> oi.getOrder().getId(),
                        Collectors.mapping(this::toItemResponse, Collectors.toList())
                ));

        Map<String, List<OrderStatusHistoryResponse>> historyMap = orderStatusHistoryRepository
                .findByOrderIds(orderIds).stream()
                .collect(Collectors.groupingBy(
                        h -> h.getOrder().getId(),
                        Collectors.mapping(this::toHistoryResponse, Collectors.toList())
                ));

        return orders.stream()
                .map(o -> toResponse(o,
                        itemMap.getOrDefault(o.getId(), Collections.emptyList()),
                        historyMap.getOrDefault(o.getId(), Collections.emptyList())))
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getByOrderCode(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));

        return toResponse(order,
                orderItemRepository.findByOrderId(order.getId()).stream()
                        .map(this::toItemResponse).toList(),
                orderStatusHistoryRepository.findByOrderId(order.getId()).stream()
                        .map(this::toHistoryResponse).toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderDetailByCode(String orderCode) {
        String email = getCurrentUserEmail();

        Order order = orderRepository.findByOrderCodeAndUserEmail(orderCode, email)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));

        return toResponse(order,
                orderItemRepository.findByOrderId(order.getId()).stream()
                        .map(this::toItemResponse).toList(),
                orderStatusHistoryRepository.findByOrderId(order.getId()).stream()
                        .map(this::toHistoryResponse).toList());
    }
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public OrderResponse getOrderDetailByCodeAdmin(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));
        return toResponse(order,
                orderItemRepository.findByOrderId(order.getId()).stream()
                        .map(this::toItemResponse).toList(),
                orderStatusHistoryRepository.findByOrderId(order.getId()).stream()
                        .map(this::toHistoryResponse).toList());
    }

    @Transactional(readOnly = true)
    public List<OrderStatusHistoryResponse> getOrderTracking(String orderId) {
        String email = getCurrentUserEmail();
        orderRepository.findByIdAndUserEmail(orderId, email)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));
        return orderStatusHistoryRepository.findByOrderId(orderId)
                .stream().map(this::toHistoryResponse).toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN — LIST + HISTORY
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<AdminOrderResponse> getOrders(
            int page, int size, String keyword,
            OrderStatus status, PaymentStatus paymentStatus) {

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Order> orders = orderRepository.searchOrders(
                keyword, status, paymentStatus, pageable);

        List<AdminOrderResponse> content = orders.getContent().stream()
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

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public List<OrderStatusHistoryResponse> getOrderHistory(String orderId) {
        if (!orderRepository.existsById(orderId)) {
            throw new AppException(ErrorCode.ORDER_NOT_EXISTED);
        }
        return orderStatusHistoryRepository.findByOrderId(orderId)
                .stream().map(this::toHistoryResponse).toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VALIDATE STATUS TRANSITION
    // ─────────────────────────────────────────────────────────────────────────

    private void validateStatusTransition(OrderStatus current, OrderStatus next) {
        if (current == next) throw new AppException(ErrorCode.INVALID_ORDER_STATUS);

        boolean valid = switch (current) {
            case PENDING   -> next == OrderStatus.CONFIRMED || next == OrderStatus.SHIPPING || next == OrderStatus.DELIVERED || next == OrderStatus.CANCELLED;
            case CONFIRMED -> next == OrderStatus.SHIPPING  || next == OrderStatus.DELIVERED || next == OrderStatus.CANCELLED;
            case SHIPPING  -> next == OrderStatus.DELIVERED;
            default        -> false; // DELIVERED, CANCELLED không thể chuyển
        };

        if (!valid) throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
    }
}
