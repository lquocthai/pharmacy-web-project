package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.dto.request.CreateAddressRequest;
import com.quocthai.pharmacy_service.dto.request.UpdateAddressRequest;
import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.UserAddressResponse;
import com.quocthai.pharmacy_service.service.UserAddressService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/users/addresses")
public class UserAddressController {

    UserAddressService userAddressService;

    /**
     * GET /users/addresses
     * Lấy tất cả địa chỉ của user hiện tại — cần đăng nhập.
     * Địa chỉ default luôn đứng đầu.
     */
    @GetMapping
    ApiResponse<List<UserAddressResponse>> getMyAddresses() {
        return ApiResponse.<List<UserAddressResponse>>builder()
                .result(userAddressService.getMyAddresses())
                .build();
    }

    /**
     * POST /users/addresses
     * Thêm địa chỉ mới — cần đăng nhập.
     * Nếu isDefault = true → tự động unset default cũ.
     * Nếu là địa chỉ đầu tiên → tự động set default.
     */
    @PostMapping
    ApiResponse<UserAddressResponse> createAddress(@RequestBody @Valid CreateAddressRequest request) {
        log.info("POST /users/addresses");
        return ApiResponse.<UserAddressResponse>builder()
                .result(userAddressService.createAddress(request))
                .build();
    }

    /**
     * PUT /users/addresses/{id}
     * Sửa địa chỉ — chỉ chủ sở hữu.
     */
    @PutMapping("/{id}")
    ApiResponse<UserAddressResponse> updateAddress(
            @PathVariable String id,
            @RequestBody @Valid UpdateAddressRequest request) {
        log.info("PUT /users/addresses/{}", id);
        return ApiResponse.<UserAddressResponse>builder()
                .result(userAddressService.updateAddress(id, request))
                .build();
    }

    /**
     * DELETE /users/addresses/{id}
     * Xóa địa chỉ — chỉ chủ sở hữu.
     * Nếu xóa địa chỉ default → tự động set địa chỉ tiếp theo làm default.
     */
    @DeleteMapping("/{id}")
    ApiResponse<Void> deleteAddress(@PathVariable String id) {
        log.info("DELETE /users/addresses/{}", id);
        userAddressService.deleteAddress(id);
        return ApiResponse.<Void>builder()
                .message("Đã xóa địa chỉ")
                .build();
    }

    /**
     * PATCH /users/addresses/{id}/default
     * Đặt địa chỉ làm mặc định — chỉ chủ sở hữu.
     */
    @PatchMapping("/{id}/default")
    ApiResponse<UserAddressResponse> setDefault(@PathVariable String id) {
        log.info("PATCH /users/addresses/{}/default", id);
        return ApiResponse.<UserAddressResponse>builder()
                .result(userAddressService.setDefault(id))
                .build();
    }
}
