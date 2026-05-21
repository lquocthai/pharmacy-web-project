package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.constants.OrderStatus;
import com.quocthai.pharmacy_service.constants.PaymentMethod;
import com.quocthai.pharmacy_service.constants.PaymentStatus;
import com.quocthai.pharmacy_service.dto.request.CancelOrderRequest;
import com.quocthai.pharmacy_service.dto.request.CreateOrderRequest;
import com.quocthai.pharmacy_service.dto.request.OrderItemRequest;
import com.quocthai.pharmacy_service.dto.request.PlaceOrderRequest;
import com.quocthai.pharmacy_service.dto.response.*;
import com.quocthai.pharmacy_service.entity.*;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    InventoryRepository inventoryRepository;
    ProductImageRepository productImageRepository;

    // ── Phí vận chuyển cố định (có thể mở rộng sau) ──────────────────────────
    private static final BigDecimal SHIPPING_FEE = BigDecimal.valueOf(30_000);
    private final ProductRepository productRepository;

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
        String random = String.format("%04d", new Random().nextInt(10000));
        String code = "QT-" + date + "-" + random;
        // Đảm bảo không trùng
        while (orderRepository.existsByOrderCode(code)) {
            random = String.format("%04d", new Random().nextInt(10000));
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
                .imageUrl(oi.getImageUrl())
                .unit(oi.getUnit())
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

    // ── Trừ tồn kho FIFO ──────────────────────────────────────────────────────
    private void deductInventoryFIFO(OrderItem item) {
        String productId = item.getProduct().getId();
        int quantity = item.getQuantity();

        List<Inventory> batches =
                inventoryRepository.findAvailableBatchesByProductId(productId);

        int remaining = quantity;

        for (Inventory batch : batches) {
            if (remaining <= 0) break;

            int currentStock = batch.getStockQuantity();
            if (currentStock <= 0) continue;

            int deduct = Math.min(currentStock, remaining);

            batch.setStockQuantity(currentStock - deduct);
            remaining -= deduct;
        }

        if (remaining > 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
        }
    }

    // ── Hoàn lại tồn kho khi hủy đơn ─────────────────────────────────────────
    // sẽ phát triển restore sau
    private void restoreInventory(List<OrderItem> items) {
        for (OrderItem item : items) {
            if (item.getProduct() == null) continue;
            List<Inventory> batches = inventoryRepository
                    .findAvailableBatchesByProductId(item.getProduct().getId());
            // Hoàn vào lô đầu tiên (hoặc tạo logic phức tạp hơn nếu cần)
            if (!batches.isEmpty()) {
                Inventory first = batches.get(0);
                first.setStockQuantity(first.getStockQuantity() + item.getQuantity());
                inventoryRepository.save(first);
            }
        }
    }


// POST /orders — Đặt hàng
// ═══════════════════════════════════════════════════════════════════════════
    @Transactional
    public OrderResponse placeOrder(CreateOrderRequest request) {

        String email = getCurrentUserEmail();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // 1. Validate địa chỉ thuộc user
        UserAddress address = userAddressRepository
                .findOwnedAddress(request.getAddressId(), email)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_EXISTED));

        // 2. Lấy productIds từ request
        List<String> productIds = request.getItems()
                .stream()
                .map(OrderItemRequest::getProductId)
                .distinct()
                .toList();

        // 3. Query products
        List<Product> products = productRepository.findAllById(productIds);

        Map<String, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        // Validate product tồn tại
        if (products.size() != productIds.size()) {
            throw new AppException(ErrorCode.PRODUCT_NOT_EXISTED);
        }

        // 4. Lấy ảnh primary
        Map<String, String> imageMap = productImageRepository
                .findPrimaryImages(productIds)
                .stream()
                .collect(Collectors.toMap(
                        img -> img.getProduct().getId(),
                        ProductImage::getImageUrl,
                        (a, b) -> a
                ));

        // 5. Validate stock
        Map<String, Integer> stockMap = inventoryRepository.getStockMap(productIds)
                .stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> ((Number) row[1]).intValue()
                ));

        for (OrderItemRequest item : request.getItems()) {

            int available = stockMap.getOrDefault(item.getProductId(), 0);

            if (available < item.getQuantity()) {
                throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
            }
        }

        // 6. Build order items + calculate total
        List<OrderItem> orderItems = new ArrayList<>();

        BigDecimal calculatedTotal = BigDecimal.ZERO;

        for (OrderItemRequest itemRequest : request.getItems()) {

            Product product = productMap.get(itemRequest.getProductId());

            BigDecimal price = product.getPrice();

            BigDecimal subtotal = price.multiply(
                    BigDecimal.valueOf(itemRequest.getQuantity())
            );

            calculatedTotal = calculatedTotal.add(subtotal);

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .productSlug(product.getSlug())
                    .imageUrl(imageMap.get(product.getId()))
                    .unit(product.getUnit())
                    .quantity(itemRequest.getQuantity())
                    .priceAtTime(price)
                    .subtotal(subtotal)
                    .build();

            orderItems.add(orderItem);
        }

        // 7. Validate total amount frontend gửi xuống
        if (calculatedTotal.compareTo(
                BigDecimal.valueOf(request.getTotalAmount())) != 0) {

            throw new AppException(ErrorCode.INVALID_ORDER_AMOUNT);
        }

        // 8. Validate shipping fee
        BigDecimal shippingFee = BigDecimal.valueOf(request.getShippingFee());

//        if (shippingFee.compareTo(BigDecimal.ZERO) < 0) {
//            throw new AppException(ErrorCode.INVALID_SHIPPING_FEE);
//        }

        BigDecimal finalAmount = calculatedTotal.add(shippingFee);

        // 9. Create order
        Order order = Order.builder()
                .orderCode(generateOrderCode())
                .user(user)
                .status(OrderStatus.PENDING)
                .paymentMethod(
                        PaymentMethod.valueOf(request.getPaymentMethod())
                )
                .paymentStatus(PaymentStatus.UNPAID)
                .totalAmount(calculatedTotal)
                .shippingFee(shippingFee)
                .finalAmount(finalAmount)
                .note(request.getNote())

                // snapshot shipping address
                .shippingFullName(address.getFullName())
                .shippingPhone(address.getPhone())
                .shippingProvince(address.getProvince())
                .shippingDistrict(address.getDistrict())
                .shippingWard(address.getWard())
                .shippingAddressDetail(address.getAddressDetail())

                .build();

        orderRepository.save(order);

        // 10. Set order vào orderItems
        orderItems.forEach(item -> item.setOrder(order));

        orderItemRepository.saveAll(orderItems);

        // 11. Trừ tồn kho FIFO
        for (OrderItem item : orderItems) {
            deductInventoryFIFO(item);
        }

        // 12. Tạo tracking đầu tiên
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .status(OrderStatus.PENDING)
                .note("Đơn hàng được tạo")
                .changedBy(email)
                .build();

        orderStatusHistoryRepository.save(history);

        // 13. Xóa selected items khỏi cart
        List<String> selectedProductIds = request.getItems()
                .stream()
                .map(OrderItemRequest::getProductId)
                .toList();

        cartItemRepository.deleteSelectedItems(
                user.getId(),
                selectedProductIds
        );

        // 14. Build response
        List<OrderItemResponse> itemResponses = orderItems.stream()
                .map(this::toItemResponse)
                .toList();

        List<OrderStatusHistoryResponse> historyResponses =
                List.of(toHistoryResponse(history));

        return toResponse(order, itemResponses, historyResponses);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GET /orders — Lịch sử đơn hàng ( lọc status)
    // ═══════════════════════════════════════════════════════════════════════════
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(OrderStatus status) {
        String email = getCurrentUserEmail();

        // 1. Lấy tất cả orders theo status (nếu null thì lấy hết)
        List<Order> orders = orderRepository.findByUserEmail(email, status);

        if (orders.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> orderIds = orders.stream()
                .map(Order::getId)
                .toList();

        // 2. Lấy items batch
        List<OrderItem> allItems = orderItemRepository.findByOrderIds(orderIds);

        Map<String, List<OrderItemResponse>> itemMap = allItems.stream()
                .collect(Collectors.groupingBy(
                        oi -> oi.getOrder().getId(),
                        Collectors.mapping(this::toItemResponse, Collectors.toList())
                ));

        // 3. Lấy history batch
        List<OrderStatusHistory> allHistory = orderStatusHistoryRepository.findByOrderIds(orderIds);

        Map<String, List<OrderStatusHistoryResponse>> historyMap = allHistory.stream()
                .collect(Collectors.groupingBy(
                        h -> h.getOrder().getId(),
                        Collectors.mapping(this::toHistoryResponse, Collectors.toList())
                ));

        // 4. Map response
        return orders.stream()
                .map(o -> toResponse(
                        o,
                        itemMap.getOrDefault(o.getId(), Collections.emptyList()),
                        historyMap.getOrDefault(o.getId(), Collections.emptyList())
                ))
                .toList();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GET /orders/{orderId} — Chi tiết 1 đơn hàng
    // ═══════════════════════════════════════════════════════════════════════════
    @Transactional(readOnly = true)
    public OrderResponse getOrderDetail(String orderId) {
        String email = getCurrentUserEmail();

        // Query 1: Order (ownership check)
        Order order = orderRepository.findByIdAndUserEmail(orderId, email)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));

        // Query 2: Items
        List<OrderItemResponse> items = orderItemRepository.findByOrderId(orderId)
                .stream().map(this::toItemResponse).toList();

        // Query 3: History
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
}
