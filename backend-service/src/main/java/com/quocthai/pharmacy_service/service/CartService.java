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
    ProductRepository productRepository;
    InventoryRepository inventoryRepository;
    UserRepository userRepository;
    ProductImageRepository productImageRepository;


    // ================= AUTH =================
    private String getCurrentUserEmail() {
        var auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null
                || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return auth.getName();
    }

    // ================= CORE =================

    private Cart getOrCreateCart(User user) {
        return cartRepository.findByUserEmail(user.getEmail())
                .orElseGet(() -> cartRepository.save(
                        Cart.builder().user(user).build()
                ));
    }

    private int getStock(String productId) {
        return inventoryRepository.getTotalStockByProductId(productId);
    }

    private Map<String, Integer> getStockMap(List<CartItem> items) {
        List<String> productIds = items.stream()
                .map(i -> i.getProduct().getId())
                .toList();
        // convert từ object ở repo trả về sang map string productId và int quantity
        return inventoryRepository.getStockMap(productIds)
                .stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> ((Number) row[1]).intValue()
                ));
    }
    // ================= IMAGE MAP =================
    private Map<String, String> getImageMap(List<CartItem> items) {
        List<String> productIds = items.stream()
                .map(i -> i.getProduct().getId())
                .toList();

        return productImageRepository.findPrimaryImages(productIds)
                .stream()
                .collect(Collectors.toMap(
                        img -> img.getProduct().getId(),
                        ProductImage::getImageUrl,
                        (existingValue, newValue) -> existingValue // nếu trung key product_id thi lay cai cũ
                ));
    }

    // ================= MAPPER =================
    private CartResponse toCartResponse(Cart cart, List<CartItem> items, Map<String,
            String> imageMap,Map<String, Integer> stockMap) {

        List<CartItemResponse> responses = items.stream()
                .map(item -> {
                    Product p = item.getProduct();

                    return CartItemResponse.builder()
                            .id(item.getId())
                            .productId(p.getId())
                            .productName(p.getName())
                            .productSlug(p.getSlug())
                            .unit(p.getUnit())
                            .price(p.getPrice())
                            .priceAtTime(item.getPriceAtTime())
                            .quantity(item.getQuantity())
                            .subtotal(item.getSubtotal())
                            .imageUrl(imageMap.get(p.getId()))
                            .stockQuantity(stockMap.getOrDefault(p.getId(), 0))
                            .build();
                })
                .toList();

        return CartResponse.builder()
                .id(cart.getId())
                .items(responses)
                .totalItems(responses.size()) // số loại sản phẩm
                .totalQuantity(
                        responses.stream().mapToInt(CartItemResponse::getQuantity).sum()
                )
                .build();
    }

    // ================= GET CART =================
    @Transactional(readOnly = true)
    public CartResponse getCart() {
        String email = getCurrentUserEmail();

        Cart cart = cartRepository.findByUserEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_EXISTED));

        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());

        Map<String, String> imageMap = getImageMap(items);
        Map<String, Integer> stockMap = getStockMap(items);

        return toCartResponse(cart, items, imageMap,stockMap);
    }

    // ================= ADD ITEM =================
    @Transactional
    public CartResponse addItem(AddToCartRequest request) {

        String email = getCurrentUserEmail();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

        int stock = getStock(product.getId());
        if (stock <= 0) throw new AppException(ErrorCode.OUT_OF_STOCK);

        Cart cart = getOrCreateCart(user);

        CartItem item = cartItemRepository
                .findByCartIdAndProductId(cart.getId(), product.getId())
                .map(existing -> {
                    int newQty = existing.getQuantity() + request.getQuantity();
                    if (newQty > stock) throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
                    existing.setQuantity(newQty);
                    return existing;
                })
                .orElseGet(() -> {
                    if (request.getQuantity() > stock)
                        throw new AppException(ErrorCode.INSUFFICIENT_STOCK);

                    return CartItem.builder()
                            .cart(cart)
                            .product(product)
                            .quantity(request.getQuantity())
                            .priceAtTime(product.getPrice())
                            .build();
                });

        cartItemRepository.save(item);

        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        Map<String, String> imageMap = getImageMap(items);
        Map<String, Integer> stockMap = getStockMap(items);
        return toCartResponse(cart, items, imageMap,stockMap);
    }

    // ================= UPDATE ITEM =================
    @Transactional
    public CartResponse updateItem(String itemId, UpdateCartItemRequest request) {

        String email = getCurrentUserEmail();

        CartItem item = cartItemRepository.findOwnedItem(itemId, email)
                .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_EXISTED));

        int stock = getStock(item.getProduct().getId());
        if (request.getQuantity() > stock) {
            throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
        }

        item.setQuantity(request.getQuantity());

        Cart cart = item.getCart();
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        Map<String, String> imageMap = getImageMap(items);
        Map<String, Integer> stockMap = getStockMap(items);

        return toCartResponse(cart, items, imageMap,stockMap);
    }

    // ================= REMOVE ITEM =================
    @Transactional
    public CartResponse removeItem(String itemId) {

        String email = getCurrentUserEmail();

        CartItem item = cartItemRepository.findOwnedItem(itemId, email)
                .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_EXISTED));

        Cart cart = item.getCart();

        cartItemRepository.delete(item);

        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        Map<String, String> imageMap = getImageMap(items);
        Map<String, Integer> stockMap = getStockMap(items);

        return toCartResponse(cart, items, imageMap,stockMap);
    }

    // ================= CLEAR CART =================
    @Transactional
    public void clearCart() {
        String email = getCurrentUserEmail();

        Cart cart = cartRepository.findByUserEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_EXISTED));

        cart.getItems().clear();
    }

    // ================= INCREASE =================
    @Transactional
    public CartResponse increaseItem(String itemId) {

        String email = getCurrentUserEmail();

        CartItem item = cartItemRepository.findOwnedItem(itemId, email)
                .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_EXISTED));

        int stock = getStock(item.getProduct().getId());

        if (item.getQuantity() + 1 > stock) {
            throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
        }

        item.setQuantity(item.getQuantity() + 1);

        Cart cart = item.getCart();
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        Map<String, String> imageMap = getImageMap(items);
        Map<String, Integer> stockMap = getStockMap(items);

        return toCartResponse(cart, items, imageMap,stockMap);
    }

    // ================= DECREASE =================
    @Transactional
    public CartResponse decreaseItem(String itemId) {

        String email = getCurrentUserEmail();

        CartItem item = cartItemRepository.findOwnedItem(itemId, email)
                .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_EXISTED));

        int newQty = item.getQuantity() - 1;
        if (newQty <= 0) throw new AppException(ErrorCode.INVALID_QUANTITY);

        item.setQuantity(newQty);

        Cart cart = item.getCart();
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        Map<String, String> imageMap = getImageMap(items);
        Map<String, Integer> stockMap = getStockMap(items);

        return toCartResponse(cart, items, imageMap,stockMap);
    }
}
