package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.dto.request.AddToCartRequest;
import com.quocthai.pharmacy_service.dto.request.UpdateCartItemRequest;
import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.CartResponse;
import com.quocthai.pharmacy_service.service.CartService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/carts")
public class CartController {

    CartService cartService;

    /**
     * GET /cart
     * Lấy giỏ hàng của user hiện tại.
     * Nếu chưa có giỏ hàng → trả về giỏ rỗng (không tạo mới).
     */
    @GetMapping
    ApiResponse<CartResponse> getCart() {
        return ApiResponse.<CartResponse>builder()
                .result(cartService.getCart())
                .build();
    }

    /**
     * POST /cart/items
     * Thêm sản phẩm vào giỏ.
     * Nếu sản phẩm đã có → cộng thêm quantity.
     * Nếu chưa có giỏ → tự động tạo mới.
     */
    @PostMapping("/items")
    ApiResponse<CartResponse> addItem(@RequestBody @Valid AddToCartRequest request) {
        log.info("POST /cart/items - productId={}, qty={}", request.getProductId(), request.getQuantity());
        return ApiResponse.<CartResponse>builder()
                .result(cartService.addItem(request))
                .build();
    }

    /**
     * PUT /cart/items/{itemId}
     * Cập nhật số lượng của 1 sản phẩm trong giỏ.
     */
    @PutMapping("/items/{itemId}")
    ApiResponse<CartResponse> updateItem(
            @PathVariable String itemId,
            @RequestBody @Valid UpdateCartItemRequest request) {
        log.info("PUT /cart/items/{} - qty={}", itemId, request.getQuantity());
        return ApiResponse.<CartResponse>builder()
                .result(cartService.updateItem(itemId, request))
                .build();
    }

    /**
     * DELETE /cart/items/{itemId}
     * Xóa 1 sản phẩm khỏi giỏ hàng.
     */
    @DeleteMapping("/items/{itemId}")
    ApiResponse<CartResponse> removeItem(@PathVariable String itemId) {
        log.info("DELETE /cart/items/{}", itemId);
        return ApiResponse.<CartResponse>builder()
                .result(cartService.removeItem(itemId))
                .build();
    }

    /**
     * DELETE /cart
     * Xóa toàn bộ giỏ hàng.
     */
    @DeleteMapping
    ApiResponse<Void> clearCart() {
        log.info("DELETE /cart - clearing cart");
        cartService.clearCart();
        return ApiResponse.<Void>builder()
                .message("Đã xóa toàn bộ giỏ hàng")
                .build();
    }

    @PatchMapping("/items/{itemId}/increase")
    public ApiResponse<CartResponse> increase(@PathVariable String itemId) {
        return ApiResponse.<CartResponse>builder()
                .result(cartService.increaseItem(itemId))
                .build();
    }

    @PatchMapping("/items/{itemId}/decrease")
    public ApiResponse<CartResponse> decrease(@PathVariable String itemId) {
        return ApiResponse.<CartResponse>builder()
                .result(cartService.decreaseItem(itemId))
                .build();
    }
}
