package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.constants.PrescriptionStatus;
import com.quocthai.pharmacy_service.dto.request.CreatePrescriptionRequest;
import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.PrescriptionResponse;
import com.quocthai.pharmacy_service.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/prescriptions")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PrescriptionController {

    PrescriptionService prescriptionService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Void> create(
            @Valid @ModelAttribute CreatePrescriptionRequest request
    ) {
        prescriptionService.create(
                request,
                request.getImages()
        );

        return ApiResponse.<Void>builder()
                .message("Gửi đơn thuốc thành công")
                .build();
    }
    // getall
    @GetMapping("my")
    public ApiResponse<List<PrescriptionResponse>> getMyPrescriptions(
            @RequestParam(required = false)
            PrescriptionStatus status) {
        return ApiResponse
                .<List<PrescriptionResponse>>builder()
                .result(prescriptionService.getMyPrescriptions(status))
                .build();
    }
    @GetMapping("/{id}")
    public ApiResponse<PrescriptionResponse> getMyPrescriptionsById(
            @PathVariable("id") String id) {
        return ApiResponse.<PrescriptionResponse>builder()
                .result(prescriptionService.getById(id))
                .build();
    }

    // admin

}