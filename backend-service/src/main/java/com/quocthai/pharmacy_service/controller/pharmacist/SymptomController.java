package com.quocthai.pharmacy_service.controller.pharmacist;

import com.quocthai.pharmacy_service.dto.request.CreateSymptomsRequest;
import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.service.SymptomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pharmacist/symptoms")
@RequiredArgsConstructor
public class SymptomController {

    private final SymptomService symptomService;

    @GetMapping("/{productId}")
    public ApiResponse<List<String>> getSymptoms(
            @PathVariable String productId
    ) {

        return ApiResponse.<List<String>>builder()
                .result(symptomService.getSymptoms(productId))
                .message("Lấy danh sách triệu chứng thành công!")
                .build();
    }

    /**
     * POST /pharmacist/symptoms/add/{productId}
     * Thêm triệu chứng vào sản phẩm (giữ lại triệu chứng cũ, cộng thêm mới).
     */
    @PostMapping("/add/{productId}")
    public ApiResponse<Void> addSymptoms(
            @PathVariable String productId,
            @Valid @RequestBody CreateSymptomsRequest request
    ) {
        symptomService.addSymptoms(productId, request.getNames());
        return ApiResponse.<Void>builder()
                .message("Thêm triệu chứng thành công!")
                .build();
    }

    /**
     * PUT /pharmacist/symptoms/edit/{productId}
     * Thay thế toàn bộ triệu chứng của sản phẩm bằng danh sách mới.
     */
    @PutMapping("/edit/{productId}")
    public ApiResponse<Void> editSymptoms(
            @PathVariable String productId,
            @Valid @RequestBody CreateSymptomsRequest request
    ) {
        symptomService.editSymptoms(productId, request.getNames());
        return ApiResponse.<Void>builder()
                .message("Cập nhật triệu chứng thành công!")
                .build();
    }
}
