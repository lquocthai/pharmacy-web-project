package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAddressRepository extends JpaRepository<UserAddress, String> {

    // Lấy tất cả địa chỉ của user — JOIN FETCH user để tránh lazy load
    @Query("SELECT a FROM UserAddress a WHERE a.user.email = :email ORDER BY a.defaultAddress DESC, a.createdAt DESC")
    List<UserAddress> findByUserEmail(@Param("email") String email);

    // Kiểm tra ownership — chỉ cho sửa/xóa địa chỉ của chính mình
    @Query("SELECT a FROM UserAddress a WHERE a.id = :id AND a.user.email = :email")
    Optional<UserAddress> findOwnedAddress(@Param("id") String id, @Param("email") String email);

    // Đặt tất cả địa chỉ của user về isDefault = false trước khi set default mới
    @Modifying
    @Query("UPDATE UserAddress a SET a.defaultAddress = false WHERE a.user.email = :email")
    void clearDefaultByUserEmail(@Param("email") String email);

    // Đếm số địa chỉ của user — giới hạn tối đa (ví dụ 10)
    @Query("SELECT COUNT(a) FROM UserAddress a WHERE a.user.email = :email")
    long countByUserEmail(@Param("email") String email);
}
