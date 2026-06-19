package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.dto.request.*;
import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.UserResponse;
import com.quocthai.pharmacy_service.service.UserService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/users") // khai báo ở đây thì không cần khai báo mấy chổ post get ... nửa
public class UserController {
    UserService userService;

    @PostMapping("/register")
    ApiResponse<String> register(@RequestBody @Valid UserCreationRequest request) {
        log.info("Controller: Registering user and sending OTP to {}", request.getEmail());

        // Gọi service để lưu tạm user và gửi mail
        userService.register(request);

        return ApiResponse.<String>builder()
                .result("Mã OTP đã được gửi vào Email của bạn. Vui lòng xác thực để hoàn tất.")
                .build();
    }
    // 2. Xác thực OTP
    @PostMapping("/verify")
    ApiResponse<UserResponse> verify(@RequestBody VerifyOtpRequest request) {
        log.info("Controller: Verifying OTP for email: {}", request.getEmail());
        var result = userService.verifyOtp(request);
        return ApiResponse.<UserResponse>builder()
                .result(result)
                .build();
    }
    // 3. resend otp
    @PostMapping("/resend-otp")
    ApiResponse<String> resendOtp(@RequestBody ResendOtpRequest request) {
        log.info("Controller: Resending OTP for email: {}", request.getEmail());
        String result = userService.resendOtp(request);
        return ApiResponse.<String>builder()
                .result(result)
                .build();
    }
    // 4.update user
    @PutMapping("/{userId}")
    ApiResponse<UserResponse> updateUser(
            @RequestBody @Valid UserUpdateRequest request, @PathVariable("userId") String userId) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateUser(userId, request))
                .build();
    }
    @GetMapping("/me")
        // truyền biến userId vào
    ApiResponse<UserResponse> getMyInfo() {
        return ApiResponse.<UserResponse>builder().result(userService.getMe()).build();
    }
    // forgot password
    // 5. Yêu cầu quên mật khẩu (Gửi mã OTP khôi phục)
    @PostMapping("/forgot-password")
    ApiResponse<String> forgotPassword(@RequestBody @Valid ForgotPasswordRequest request) {
        String message = userService.forgotPassword(request.getEmail());
        return ApiResponse.<String>builder()
                .result(message)
                .build();
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}
