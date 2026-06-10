package com.quocthai.pharmacy_service.controller.admin;

import com.quocthai.pharmacy_service.dto.admin.response.AdminDashboardResponse;
import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.service.AdminDashboardService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminDashboardController {

    AdminDashboardService adminDashboardService;

    @GetMapping
    public ApiResponse<AdminDashboardResponse> getDashboard() {
        return ApiResponse.<AdminDashboardResponse>builder()
                .result(adminDashboardService.getDashboard())
                .build();
    }
}
