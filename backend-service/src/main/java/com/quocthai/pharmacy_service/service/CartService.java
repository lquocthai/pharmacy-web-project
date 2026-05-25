package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.dto.request.AddToCartRequest;
import com.quocthai.pharmacy_service.dto.request.UpdateCartItemRequest;
import com.quocthai.pharmacy_service.dto.response.CartItemResponse;
import com.quocthai.pharmacy_service.dto.response.CartResponse;
import com.quocthai.pharmacy_service.entity.*;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

    @Slf4j
    @Service
    @RequiredArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
    public class CartService {
        CartRepository cartRepository;
        CartItemRepository cartItemRepository;
        ProductVariantRepository productVariantRepository;
        InventoryBatchRepository inventoryBatchRepository;
        UserRepository userRepository;

        // ================= AUTHENTICATION =================
        private String getCurrentUserEmail() {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
            return auth.getName();
        }

        // ================= CORE INVENTORY HELPERS =================
        // lấy tổng số lượng hàng còn lại của 1 sản phẩm mà chưa hết hạn
        private int getStock(String variantId) {
            // Chỉ tính tồn kho của các lô còn hạn sử dụng tại thời điểm hiện tại (2026)
            return inventoryBatchRepository.getTotalStockByVariantId(variantId, LocalDate.now());
        }
        // lấy tổng số lượng hàng còn lại của list sản phẩm mà chưa hết hạn
        private Map<String, Integer> getStockMap(List<CartItem> items) {
            List<String> variantIds = items.stream()
                    .map(i -> i.getVariant().getId())
                    .toList();

            return inventoryBatchRepository.getStockMapByVariantIds(variantIds, LocalDate.now())
                    .stream()
                    .collect(Collectors.toMap(
                            row -> (String) row[0],
                            row -> ((Number) row[1]).intValue()
                    ));
        }
        // lấy list ảnh của sản phẩm
        private Map<String, String> getImageMap(List<CartItem> items) {
            // xử lý stream trực tiếp trên danh sách items đã có sẵn trong RAM
            return items.stream()
                    .collect(Collectors.toMap(
                            item -> item.getVariant().getId(), // 1. Đổi Key thành variantId để không bị trùng ảnh giữa các phân loại
                            item -> {
                                ProductVariant variant = item.getVariant();
                                List<ProductImage> images =
                                        variant.getProduct().getImages();
                                return images.stream()
                                        .filter(ProductImage::isPrimary)
                                        .map(ProductImage::getImageUrl)
                                        .findFirst()
                                        // thay ảnh default cho "" nếu k có ảnh
                                        .orElseGet(() -> variant.getProduct().getImages().isEmpty()
                                                ? "" : variant.getProduct().getImages().getFirst().getImageUrl());
                            },
                            (existingValue, newValue) -> existingValue // Nếu trùng phân loại thì giữ cái cũ
                    ));
        }


        // tạo or lấy cái cart ra
        private Cart getOrCreateCart(User user) {
            return cartRepository.findByUserEmail(user.getEmail())
                    .orElseGet(() -> cartRepository.save(
                            Cart.builder().user(user).build()
                    ));
        }

        // ================= MAPPER TO DTO =================

        private CartResponse toCartResponse(Cart cart, List<CartItem> items,
                                            Map<String, String> imageMap, Map<String, Integer> stockMap) {

            List<CartItemResponse> responses = items.stream()
                    .map(item -> {
                        ProductVariant variant = item.getVariant();
                        Product p = variant.getProduct();

                        return CartItemResponse.builder()
                                .id(item.getId())
                                .productId(p.getId())
                                .productName(p.getName())
                                .productSlug(p.getSlug())
                                .variantId(variant.getId())
                                .sku(variant.getSku())
                                .variantName(variant.getVariantName())
                                .price(variant.getPrice())
                                .priceAtTime(item.getPriceAtTime())
                                .quantity(item.getQuantity())
                                .subtotal(item.getPriceAtTime().multiply(java.math.BigDecimal.valueOf(item.getQuantity())))
                                .imageUrl(imageMap.get(variant.getId())) // Lấy ảnh siêu tốc từ Map qua variantId
                                .stockQuantity(stockMap.getOrDefault(variant.getId(), 0))
                                .build();
                    })
                    .toList();

            return CartResponse.builder()
                    .id(cart.getId())
                    .items(responses)
                    .totalItems(responses.size())
                    .totalQuantity(responses.stream().mapToInt(CartItemResponse::getQuantity).sum())
                    .build();
        }

        // ================= OPERATIONS =================
        @Transactional(readOnly = true)
        public CartResponse getCart() {
            String email = getCurrentUserEmail();

            Cart cart = cartRepository.findByUserEmail(email)
                    .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_EXISTED));
            return buildCartResponse(cart);
        }

        @Transactional
        public CartResponse addItem(AddToCartRequest request) {
            String email = getCurrentUserEmail();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

            ProductVariant variant = productVariantRepository.findById(request.getVariantId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED)); // Dùng tạm Code lỗi cũ hoặc đổi thành VARIANT_NOT_EXISTED
            // check stock còn hàng k
            int stock = getStock(variant.getId());
            if (stock <= 0) throw new AppException(ErrorCode.OUT_OF_STOCK);

            Cart cart = getOrCreateCart(user);

            CartItem item = cartItemRepository
                    .findByCartIdAndVariantId(cart.getId(), variant.getId())
                    .map(existing -> {
                        int newQty = existing.getQuantity() + request.getQuantity();
                        if (newQty > stock) throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
                        existing.setQuantity(newQty);
                        return existing;
                    })
                    .orElseGet(() -> {
                        if (request.getQuantity() > stock) throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
                        return CartItem.builder()
                                .cart(cart)
                                .variant(variant)
                                .product(variant.getProduct()) // Bảo toàn dữ liệu nếu Entity CartItem vẫn giữ trường product
                                .quantity(request.getQuantity())
                                .priceAtTime(variant.getPrice())
                                .build();
                    });

            cartItemRepository.save(item);

            return buildCartResponse(cart);
        }

        @Transactional
        public CartResponse updateItem(String itemId, UpdateCartItemRequest request) {
            String email = getCurrentUserEmail();
            CartItem item = cartItemRepository.findOwnedItem(itemId, email)
                    .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_EXISTED));

            int stock = getStock(item.getVariant().getId());
            if (request.getQuantity() > stock) throw new AppException(ErrorCode.INSUFFICIENT_STOCK);

            item.setQuantity(request.getQuantity());

            Cart cart = item.getCart();
            return buildCartResponse(cart);
        }

        @Transactional
        public CartResponse removeItem(String itemId) {
            String email = getCurrentUserEmail();
            CartItem item = cartItemRepository.findOwnedItem(itemId, email)
                    .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_EXISTED));

            Cart cart = item.getCart();
            cartItemRepository.delete(item);

            return buildCartResponse(cart);
        }

        @Transactional
        public void clearCart() {
            String email = getCurrentUserEmail();
            Cart cart = cartRepository.findByUserEmail(email)
                    .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_EXISTED));
            cartItemRepository.deleteAll(cart.getItems());
            cart.getItems().clear();
        }

        @Transactional
        public CartResponse increaseItem(String itemId) {
            String email = getCurrentUserEmail();
            CartItem item = cartItemRepository.findOwnedItem(itemId, email)
                    .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_EXISTED));

            int stock = getStock(item.getVariant().getId());
            if (item.getQuantity() + 1 > stock) throw new AppException(ErrorCode.INSUFFICIENT_STOCK);

            item.setQuantity(item.getQuantity() + 1);

            Cart cart = item.getCart();
            return buildCartResponse(cart);
        }

        @Transactional
        public CartResponse decreaseItem(String itemId) {
            String email = getCurrentUserEmail();
            CartItem item = cartItemRepository.findOwnedItem(itemId, email)
                    .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_EXISTED));

            int newQty = item.getQuantity() - 1;
            if (newQty <= 0) throw new AppException(ErrorCode.INVALID_QUANTITY);

            item.setQuantity(newQty);

            Cart cart = item.getCart();
            return buildCartResponse(cart);
        }
        // build method reuse
        private CartResponse buildCartResponse(Cart cart) {

            List<CartItem> items = cartItemRepository.findByCartIdWithProductDetails(cart.getId());

            Map<String, String> imageMap = getImageMap(items);

            Map<String, Integer> stockMap = getStockMap(items);

            return toCartResponse(cart, items, imageMap, stockMap);
        }
    }


