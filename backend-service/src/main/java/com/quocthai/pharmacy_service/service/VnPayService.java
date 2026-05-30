package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.constants.OrderStatus;
import com.quocthai.pharmacy_service.constants.PaymentMethod;
import com.quocthai.pharmacy_service.constants.PaymentStatus;
import com.quocthai.pharmacy_service.dto.request.CreatePaymentRequest;
import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.entity.Order;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.repository.OrderRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.transaction.annotation.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VnPayService {
    static final String RSP_CODE = "RspCode";
    static final String MESSAGE = "Message";
    OrderRepository orderRepository;

    @NonFinal
    @Value("${vnpay.tmn-code}")
    String tmnCode;

    @NonFinal
    @Value("${vnpay.hash-secret}")
    String hashSecret;

    @NonFinal
    @Value("${vnpay.ipn-url}")
    String ipnUrl;

    @NonFinal
    @Value("${vnpay.pay-url}")
    String payUrl;

    @NonFinal
    @Value("${vnpay.return-url}")
    String returnUrl;



    /**
     * Tạo URL thanh toán VNPay
     */
    public ApiResponse<String> createPaymentUrl(
            HttpServletRequest request,
            CreatePaymentRequest paymentRequest
    ) {
        log.info("Create payment url" + paymentRequest.getAmount());

        Order order = orderRepository.findByOrderCode(paymentRequest.getOrderCode())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));

        if (order.getPaymentMethod() != PaymentMethod.VNPAY) {
            throw new AppException(ErrorCode.INVALID_PAYMENT_METHOD);
        }

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new AppException(ErrorCode.ORDER_ALREADY_PAID);
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.ORDER_ALREADY_CANCELLED);
        }

        // Verify số tiền backend
        BigDecimal finalAmount = order.getFinalAmount();

        if (finalAmount.compareTo(paymentRequest.getAmount()) != 0) {
            throw new AppException(ErrorCode.INVALID_ORDER_AMOUNT);
        }

        String amount = finalAmount
                .multiply(BigDecimal.valueOf(100))
                .toBigInteger()
                .toString();

        Map<String, String> vnpParams = new HashMap<>();

        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", tmnCode);
        vnpParams.put("vnp_Amount", amount);
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", order.getOrderCode());
        vnpParams.put("vnp_OrderInfo",
                "Thanh toan don hang: " + order.getOrderCode());
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", returnUrl);

        vnpParams.put("vnp_IpAddr", getClientIp(request));

        if (paymentRequest.getBankCode() != null
                && !paymentRequest.getBankCode().isBlank()) {

            vnpParams.put("vnp_BankCode",
                    paymentRequest.getBankCode());
        }

        Calendar calendar =
                Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));

        SimpleDateFormat formatter =
                new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));

        vnpParams.put(
                "vnp_CreateDate",
                formatter.format(calendar.getTime())
        );

        calendar.add(Calendar.MINUTE, 15);

        vnpParams.put(
                "vnp_ExpireDate",
                formatter.format(calendar.getTime())
        );

        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());

        Collections.sort(fieldNames);

        List<String> hashParts = new ArrayList<>();
        List<String> queryParts = new ArrayList<>();

        for (String fieldName : fieldNames) {

            String fieldValue = vnpParams.get(fieldName);

            // Bỏ qua field null hoặc rỗng
            if (fieldValue == null || fieldValue.isBlank()) {
                continue;
            }

            // Encode chuẩn RFC3986 theo yêu cầu VNPay
            String encodedFieldName =
                    URLEncoder.encode(
                            fieldName,
                            StandardCharsets.US_ASCII
                    );

            String encodedFieldValue =
                    URLEncoder.encode(
                            fieldValue,
                            StandardCharsets.US_ASCII
                    );

            hashParts.add(
                    fieldName + "=" + encodedFieldValue
            );

            queryParts.add(
                    encodedFieldName + "=" + encodedFieldValue
            );
        }

        String hashData = String.join("&", hashParts);

        String query = String.join("&", queryParts);

        String secureHash =
                hmacSHA512(hashSecret, hashData);

        String paymentUrl = payUrl + "?" + query + "&vnp_SecureHash=" + secureHash;
        log.info("========== VNPAY CREATE PAYMENT ==========");
        log.info("HASH DATA: {}", hashData);
        log.info("SECURE HASH: {}", secureHash);
        log.info("QUERY: {}", query);
        log.info("PAYMENT URL: {}", paymentUrl);
        return ApiResponse.<String>builder()
                .result(paymentUrl)
                .build();
    }
    @Transactional
    public void handleVnPayReturn(
            Map<String, String> params
    ) {

        try {

            boolean validSignature =
                    verifySignature(params);

            if (!validSignature) {

                log.error("Invalid VNPay return signature");

                return;
            }

            String responseCode =
                    params.get("vnp_ResponseCode");

            if (!"00".equals(responseCode)) {

                log.warn(
                        "VNPay payment failed with code {}",
                        responseCode
                );

                return;
            }

            String orderCode =
                    params.get("vnp_TxnRef");

            Order order = orderRepository
                    .findByOrderCode(orderCode)
                    .orElse(null);

            if (order == null) {

                log.error(
                        "Order not found: {}",
                        orderCode
                );

                return;
            }

            // idempotent
            if (order.getPaymentStatus() == PaymentStatus.PAID) {

                log.info(
                        "Order already paid: {}",
                        orderCode
                );

                return;
            }

            if (order.getStatus() == OrderStatus.CANCELLED) {

                log.warn(
                        "Cancelled order payment ignored: {}",
                        orderCode
                );

                return;
            }

            BigDecimal vnpAmount =
                    BigDecimal.valueOf(
                            Long.parseLong(
                                    params.get("vnp_Amount")
                            )
                    ).divide(BigDecimal.valueOf(100));

            if (vnpAmount.compareTo(order.getFinalAmount()) != 0) {

                log.error(
                        "Invalid payment amount for order {}",
                        orderCode
                );

                return;
            }

            order.setPaymentStatus(PaymentStatus.PAID);

            orderRepository.save(order);

            log.info(
                    "VNPay RETURN payment success for order {}",
                    orderCode
            );

        } catch (Exception e) {

            log.error(
                    "VNPay return processing error",
                    e
            );
        }
    }

    /**
     * Xử lý callback IPN từ VNPay
     * RAW response theo chuẩn VNPay
     */
    @Transactional
    public Map<String, String> handleVnPayIpn(
            Map<String, String> params
    ) {

        log.info("VNPay IPN received: {}", params);

        String txnRef = params.get("vnp_TxnRef");

        if (txnRef == null || txnRef.isBlank()) {

            return Map.of(
                    RSP_CODE, "01",
                    MESSAGE, "Order not found"
            );
        }

        Order order = orderRepository.findByOrderCode(txnRef)
                .orElse(null);

        if (order == null) {

            return Map.of(
                    RSP_CODE, "01",
                    MESSAGE, "Order not found"
            );
        }

        // Idempotent chống callback nhiều lần
        if (order.getPaymentStatus() == PaymentStatus.PAID) {

            return Map.of(
                    RSP_CODE, "00",
                    MESSAGE, "Order already confirmed"
            );
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {

            return Map.of(
                    RSP_CODE, "02",
                    MESSAGE, "Order cancelled"
            );
        }

        boolean validSignature = verifySignature(params);

        if (!validSignature) {

            return Map.of(
                    RSP_CODE, "97",
                    MESSAGE, "Invalid signature"
            );
        }

        String responseCode = params.get("vnp_ResponseCode");

        if (!"00".equals(responseCode)) {
            //thanh toán không thành công
            order.setPaymentStatus(PaymentStatus.UNPAID);

            orderRepository.save(order);

            return Map.of(
                    RSP_CODE, "00",
                    MESSAGE, "Payment failed"
            );
        }

        // Verify amount
        BigDecimal vnpAmount =
                BigDecimal.valueOf(
                        Long.parseLong(params.get("vnp_Amount"))
                ).divide(BigDecimal.valueOf(100));

        if (vnpAmount
                .compareTo(order.getFinalAmount()) != 0) {

            return Map.of(
                    RSP_CODE, "04",
                    MESSAGE, "Invalid amount"
            );
        }

        // SUCCESS
        order.setPaymentStatus(PaymentStatus.PAID);

        orderRepository.save(order);

        log.info(
                "VNPay payment success for order {}",
                order.getOrderCode()
        );

        return Map.of(
                RSP_CODE, "00",
                MESSAGE, "Confirm Success"
        );
    }

    /**
     * Verify chữ ký callback VNPay
     */
    public boolean verifySignature(Map<String, String> inputData) {

        Map<String, String> fields = new HashMap<>(inputData);

        String secureHash = fields.remove("vnp_SecureHash");

        fields.remove("vnp_SecureHashType");

        List<String> fieldNames = new ArrayList<>(fields.keySet());

        Collections.sort(fieldNames);

        List<String> hashParts = new ArrayList<>();

        for (String fieldName : fieldNames) {

            String fieldValue = fields.get(fieldName);

            if (fieldValue == null || fieldValue.isBlank()) {
                continue;
            }

            String encodedValue =
                    URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII);

            hashParts.add(fieldName + "=" + encodedValue);
        }

        String hashData = String.join("&", hashParts);

        String calculatedHash =
                hmacSHA512(hashSecret, hashData);

        log.info("========== VERIFY VNPAY ==========");
        log.info("HASH DATA: {}", hashData);
        log.info("CALCULATED HASH: {}", calculatedHash);
        log.info("RECEIVED HASH: {}", secureHash);

        return calculatedHash.equalsIgnoreCase(secureHash);
    }

    private String hmacSHA512(
            String key,
            String data
    ) {

        try {

            Mac hmac512 =
                    Mac.getInstance("HmacSHA512");

            SecretKeySpec secretKey =
                    new SecretKeySpec(
                            key.getBytes(StandardCharsets.UTF_8),
                            "HmacSHA512"
                    );

            hmac512.init(secretKey);

            byte[] bytes =
                    hmac512.doFinal(
                            data.getBytes(StandardCharsets.UTF_8)
                    );

            StringBuilder hash = new StringBuilder();

            for (byte b : bytes) {
                hash.append(String.format("%02x", b));
            }

            return hash.toString();

        } catch (Exception e) {

            throw new AppException(ErrorCode.GENERATE_SIGNATURE_FAILURE);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isBlank()) {
            ipAddress = request.getRemoteAddr();
        }
        // localhost IPv6 -> IPv4
        if ("0:0:0:0:0:0:0:1".equals(ipAddress)) {
            ipAddress = "127.0.0.1";
        }
        return ipAddress;
    }
}