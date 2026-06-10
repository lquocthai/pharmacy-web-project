package com.quocthai.pharmacy_service.controller.admin;

import com.quocthai.pharmacy_service.dto.admin.request.AdminCreateUserRequest;
import com.quocthai.pharmacy_service.dto.admin.request.AdminResetPasswordRequest;
import com.quocthai.pharmacy_service.dto.admin.request.AdminUpdateRoleRequest;
import com.quocthai.pharmacy_service.dto.admin.request.UserStatusRequest;
import com.quocthai.pharmacy_service.dto.admin.response.AdminUserDetailResponse;
import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.PageResponse;
import com.quocthai.pharmacy_service.dto.response.UserResponse;
import com.quocthai.pharmacy_service.service.UserService;
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
@RequestMapping("/admin/users")
public class AdminUserController {
    UserService userService;

    @GetMapping
    ApiResponse<PageResponse<UserResponse>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active
    ) {
        return ApiResponse.<PageResponse<UserResponse>>builder()
                .result(userService.getUsers(page, size, search, active))
                .build();
    }
    @GetMapping("/{userId}")
    ApiResponse<AdminUserDetailResponse> getUserDetail(
            @PathVariable String userId
    ) {
        return ApiResponse.<AdminUserDetailResponse>builder()
                .result(userService.getUserDetail(userId))
                .build();
    }
    @PostMapping
    ApiResponse<UserResponse> createUser(
            @RequestBody @Valid AdminCreateUserRequest request
    ) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.createUser(request))
                .build();
    }
    @PutMapping("/{userId}/role")
    ApiResponse<UserResponse> updateUser(
            @PathVariable String userId,
            @RequestBody @Valid AdminUpdateRoleRequest request
    ) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateUser(userId, request))
                .build();
    }
    @PatchMapping("/{userId}/status")
    ApiResponse<Void> updateStatus(
            @PathVariable String userId,
            @RequestBody UserStatusRequest request
    ) {
        userService.updateStatus(
                userId,
                request.getActive()
        );

        return ApiResponse.<Void>builder().build();
    }
    @PatchMapping("/{userId}/reset-password")
    ApiResponse<String> resetPassword(
            @PathVariable String userId,
            @RequestBody @Valid AdminResetPasswordRequest request
    ) {
        userService.resetPasswordAdmin(
                userId,
                request.getPassword()
        );

        return ApiResponse.<String>builder()
                .message("Thay đổi mật khẩu thành công")
                .build();
    }



}
