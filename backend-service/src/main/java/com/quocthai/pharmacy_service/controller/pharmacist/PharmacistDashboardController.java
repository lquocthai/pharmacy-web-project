package com.quocthai.pharmacy_service.controller.pharmacist;

import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.PharmacistDashboardResponse;
import com.quocthai.pharmacy_service.service.PharmacistDashboardService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/pharmacist/dashboard")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PharmacistDashboardController {

    PharmacistDashboardService pharmacistDashboardService;

    @GetMapping
    public ApiResponse<PharmacistDashboardResponse> getDashboard() {
        return ApiResponse.<PharmacistDashboardResponse>builder()
                .result(pharmacistDashboardService.getDashboard())
                .build();
    }
}
