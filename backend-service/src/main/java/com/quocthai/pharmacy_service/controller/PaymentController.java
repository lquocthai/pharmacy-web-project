package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.dto.request.CreatePaymentRequest;
import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.service.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final VnPayService vnPayService;

    /**
     * Frontend gọi tạo payment URL
     */
    @PostMapping("/vnpay/create")
    public ApiResponse<String> createVnPayPayment(HttpServletRequest request,
                                                  @RequestBody CreatePaymentRequest paymentRequest) {
        return vnPayService.createPaymentUrl(
                request,
                paymentRequest
        );
    }

    /**
     * VNPay IPN callback
     * RAW response theo chuẩn VNPay
     */
    @GetMapping("/vnpay-ipn")
    public ResponseEntity<Map<String, String>> handleIpn(
            @RequestParam Map<String, String> params
    ) {
        return ResponseEntity.ok(
                vnPayService.handleVnPayIpn(params)
        );
    }
    /**
     * Browser user redirect về sau khi thanh toán
     * KHÔNG update DB ở đây
     * Chỉ redirect UI frontend
     */
    @GetMapping("/vnpay-return")
    public void vnpayReturn(
            @RequestParam Map<String, String> params,
            HttpServletResponse response
    ) throws IOException {
//        vnPayService.handleVnPayReturn(params);
        String queryString = buildQueryString(params);

        response.sendRedirect(
                "http://localhost:5173/payment-result?" + queryString
        );
    }

    private String buildQueryString(Map<String, String> params) {

        return params.entrySet()
                .stream()
                .map(entry ->
                        URLEncoder.encode(
                                entry.getKey(),
                                StandardCharsets.UTF_8
                        )
                                + "=" +
                                URLEncoder.encode(
                                        entry.getValue(),
                                        StandardCharsets.UTF_8
                                )
                )
                .collect(Collectors.joining("&"));
    }
}