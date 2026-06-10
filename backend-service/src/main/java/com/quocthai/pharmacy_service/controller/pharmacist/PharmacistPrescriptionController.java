package com.quocthai.pharmacy_service.controller.pharmacist;

import com.quocthai.pharmacy_service.constants.PrescriptionStatus;
import com.quocthai.pharmacy_service.dto.request.UpdateStatusRequest;
import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.PrescriptionResponse;
import com.quocthai.pharmacy_service.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/pharmacist/prescriptions")
public class PharmacistPrescriptionController {
    PrescriptionService prescriptionService;


    // 1. API Lấy danh sách đơn thuốc (Có filter + Phân trang chống N+1)
    @GetMapping
    public ApiResponse<Page<PrescriptionResponse>> getPrescriptions(
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) PrescriptionStatus status,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse
                .<Page<PrescriptionResponse>>builder()
                .result(prescriptionService.getPrescriptions(fullName, status, pageable))
                .build();
    }

    // 2. API Cập nhật trạng thái đơn thuốc
    @PatchMapping("/{id}/status")
    public ApiResponse<PrescriptionResponse> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateStatusRequest request) {

        return ApiResponse.<PrescriptionResponse>builder()
                .result(prescriptionService.updateStatus(id, request))
                .build();
    }
}
