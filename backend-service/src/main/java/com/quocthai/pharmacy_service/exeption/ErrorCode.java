package com.quocthai.pharmacy_service.exeption;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "invalid key", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User already existed", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be at least 3 characters", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1004, "Password must be at least 6 and max 10 characters", HttpStatus.BAD_REQUEST),
    EMAIL_INVALID(1005, "email invalid", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1006, "email already existed", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1007, "User not existed", HttpStatus.NOT_FOUND),
    OTP_INVALID(1008, "Invalid OTP code", HttpStatus.BAD_REQUEST),
    OTP_EXPIRED(1009, "OTP code has expired", HttpStatus.GONE),
    CANNOT_SEND_EMAIL(1010, "Failed to send email", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHENTICATED(1011, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1012, "you do not have permission", HttpStatus.FORBIDDEN),
    TOO_MANY_REQUESTS_OTP(1013, "Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau 10 phút.", HttpStatus.TOO_MANY_REQUESTS),
    OTP_COOLDOWN(1014, "Vui lòng đợi 60 giây để gửi lại mã tiếp theo.", HttpStatus.BAD_REQUEST),
    USER_ALREADY_ACTIVE(1015, "Tài khoản này đã được kích hoạt trước đó.", HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS(1016, "Email hoặc mật khẩu không chính xác", HttpStatus.BAD_REQUEST),

    // Cart errors
    PRODUCT_NOT_EXISTED(1017, "Sản phẩm không tồn tại", HttpStatus.NOT_FOUND),
    OUT_OF_STOCK(1018, "Sản phẩm đã hết hàng", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_STOCK(1019, "Số lượng tồn kho không đủ", HttpStatus.BAD_REQUEST),
    CART_ITEM_NOT_EXISTED(1020, "Sản phẩm không có trong giỏ hàng", HttpStatus.NOT_FOUND),
    INVALID_QUANTITY(1021, "Số lượng phải lớn hơn 0", HttpStatus.BAD_REQUEST),
    CART_NOT_EXISTED(1022, "Giỏ hàng không tồn tại", HttpStatus.BAD_REQUEST);

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
