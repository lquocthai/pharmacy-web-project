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
// Thêm import này ở đầu file nếu chưa có
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import java.net.URLDecoder;
// Thêm import này ở đầu file VnPayService.java nếu chưa có để parse ngày tháng
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

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
            log.warn(
                    "VNPay payment successful {}",
                    responseCode
            );

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

            // SUCCESS
            order.setPaymentStatus(PaymentStatus.PAID);

            // --- BỔ SUNG LƯU TRANSACTION ID VÀ THỜI GIAN THÀNH CÔNG ---
            String transactionNo = params.get("vnp_TransactionNo");
            order.setPaymentTransactionId(transactionNo);

            String payDateStr = params.get("vnp_PayDate"); // Định dạng: yyyyMMddHHmmss
            if (payDateStr != null && !payDateStr.isBlank()) {
                try {
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
                    order.setPaidAt(LocalDateTime.parse(payDateStr, formatter));
                } catch (Exception e) {
                    log.error("Không thể parse vnp_PayDate: {}", payDateStr, e);
                    order.setPaidAt(LocalDateTime.now()); // Fallback nếu lỗi parse
                }
            } else {
                order.setPaidAt(LocalDateTime.now());
            }
            // ---------------------------------------------------------

            log.info("VNPay RETURN payment success for order {}, TxnNo: {}", orderCode, transactionNo);

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
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) {
                return false;
            }
            HttpServletRequest request = attributes.getRequest();
            String queryString = request.getQueryString();

            if (queryString == null || queryString.isBlank()) {
                log.error("Query string thô trống rỗng!");
                return false;
            }

            // 1. Tách các tham số từ Query String thô để giữ nguyên định dạng (ví dụ: dấu + hay %3A)
            String[] pairs = queryString.split("&");
            Map<String, String> rawParams = new HashMap<>();
            String receivedHash = "";

            for (String pair : pairs) {
                int idx = pair.indexOf("=");
                if (idx == -1) continue;

                String key = pair.substring(0, idx);
                String value = pair.substring(idx + 1);

                if ("vnp_SecureHash".equals(key)) {
                    receivedHash = value;
                } else if (!"vnp_SecureHashType".equals(key)) {
                    // Giải mã key để sort theo Alphabet chuẩn, nhưng GIỮ NGUYÊN value thô (chứa dấu +)
                    rawParams.put(URLDecoder.decode(key, StandardCharsets.UTF_8), value);
                }
            }

            // 2. Sắp xếp key theo alphabet
            List<String> fieldNames = new ArrayList<>(rawParams.keySet());
            Collections.sort(fieldNames);

            // 3. Nối chuỗi băm bằng chính các Value thô thu được từ trình duyệt
            List<String> hashParts = new ArrayList<>();
            for (String fieldName : fieldNames) {
                String rawValue = rawParams.get(fieldName);
                if (rawValue == null || rawValue.isBlank()) {
                    continue;
                }
                // Mã hóa lại cái Key theo chuẩn gửi lên nếu cần, nhưng quan trọng nhất là VALUE phải giữ gốc
                String encodedKey = URLEncoder.encode(fieldName, StandardCharsets.US_ASCII);
                hashParts.add(encodedKey + "=" + rawValue);
            }

            String hashData = String.join("&", hashParts);
            String calculatedHash = hmacSHA512(hashSecret, hashData);

            log.info("========== VERIFY VNPAY ĐÃ FIX INTERCEPT ==========");
            log.info("CHUỖI NỐI THỰC TẾ: {}", hashData);
            log.info("MÃ BĂM TÍNH TOÁN : {}", calculatedHash);
            log.info("MÃ BĂM VNPay GỬI  : {}", receivedHash);

            boolean isMatch = calculatedHash.equalsIgnoreCase(receivedHash);
            if (isMatch) {
                log.info("👉 KẾT QUẢ: CHỮ KÝ HỢP LỆ! CHUẨN BỊ ĐỔI STATUS SANG PAID.");
            } else {
                log.error("👉 KẾT QUẢ: VẪN SAI. Kiểm tra lại vnpay.hash-secret trong file config!");
            }

            return isMatch;

        } catch (Exception e) {
            log.error("Lỗi trong quá trình verify chữ ký thô", e);
            return false;
        }
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