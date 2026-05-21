package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, String> {

    // Tìm CartItem theo cartId + productId — dùng khi thêm SP đã có trong giỏ
    @Query("SELECT ci FROM CartItem ci WHERE ci.cart.id = :cartId AND ci.product.id = :productId")
    Optional<CartItem> findByCartIdAndProductId(
            @Param("cartId") String cartId,
            @Param("productId") String productId);

    @Query("""
    SELECT ci FROM CartItem ci
    WHERE ci.id = :itemId
    AND ci.cart.user.email = :email
    """)
    Optional<CartItem> findOwnedItem(String itemId, String email);

    @Query("""
    SELECT ci FROM CartItem ci
    JOIN FETCH ci.product p
    WHERE ci.cart.id = :cartId
    """)
    List<CartItem> findByCartId(@Param("cartId") String cartId);

    // xóa items khỏi cart khi đã đặt hàng items đó
    @Modifying
    @Query("""
        DELETE FROM CartItem ci
        WHERE ci.cart.user.id = :userId
        AND ci.product.id IN :productIds
    """)
    void deleteSelectedItems(
            @Param("userId") String userId,
            @Param("productIds") List<String> productIds
    );
}
