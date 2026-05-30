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
    CART_NOT_EXISTED(1022, "Giỏ hàng không tồn tại", HttpStatus.NOT_FOUND),

    // Product detail errors
    PRODUCT_SLUG_NOT_EXISTED(1023, "Sản phẩm không tồn tại", HttpStatus.NOT_FOUND),

    // Rating errors
    RATING_NOT_EXISTED(1024, "Đánh giá không tồn tại", HttpStatus.NOT_FOUND),
    RATING_ALREADY_EXISTED(1025, "Bạn đã đánh giá sản phẩm này rồi", HttpStatus.BAD_REQUEST),
    RATING_STAR_INVALID(1026, "Số sao phải từ 1 đến 5", HttpStatus.BAD_REQUEST),

    // Address errors
    ADDRESS_NOT_EXISTED(1027, "Địa chỉ không tồn tại", HttpStatus.NOT_FOUND),
    ADDRESS_LIMIT_EXCEEDED(1028, "Bạn chỉ có thể lưu tối đa 10 địa chỉ", HttpStatus.BAD_REQUEST),
    FIELD_REQUIRED(1029, "Thông tin này không được để trống", HttpStatus.BAD_REQUEST),
    INVALID_PHONE_NUMBER(1030, "Số điện thoại không đúng định dạng", HttpStatus.BAD_REQUEST),

    // Order errors
    ORDER_NOT_EXISTED(1031, "Đơn hàng không tồn tại", HttpStatus.NOT_FOUND),
    ORDER_CANNOT_CANCEL(1032, "Đơn hàng không thể hủy ở trạng thái hiện tại", HttpStatus.BAD_REQUEST),
    CART_EMPTY(1033, "Giỏ hàng trống, không thể đặt hàng", HttpStatus.BAD_REQUEST),
    INVALID_STATUS_TRANSITION(1034, "Chuyển trạng thái đơn hàng không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_ORDER_AMOUNT(1035,"Giá đơn hàng không hợp lệ",HttpStatus.BAD_REQUEST),

    // category
    CATEGORY_NOT_FOUND(1036,"Danh mục không tồn tại",HttpStatus.NOT_FOUND),

    INVALID_PAYMENT_METHOD(1037,"Phương thức thanh toán không hợp lệ", HttpStatus.BAD_REQUEST),
    ORDER_ALREADY_PAID(1038,"Đơn hàng đã thanh toán", HttpStatus.BAD_REQUEST),
    ORDER_ALREADY_CANCELLED(1039, "Đơn hàng đã hủy", HttpStatus.BAD_REQUEST),
    GENERATE_SIGNATURE_FAILURE(1040,"Tạo chữ kí thất bại", HttpStatus.BAD_REQUEST),
    CATEGORY_NOT_EXISTED(1041,"Danh mục không tồn tại",HttpStatus.NOT_FOUND),
    PRIMARY_IMAGE_REQUIRED(1042, "Thiếu ảnh chính",HttpStatus.BAD_REQUEST),

    PRODUCT_NOT_FOUND(1043,"Sản phẩm không tồn tại",HttpStatus.NOT_FOUND),
    PRODUCT_VARIANT_REQUIRED(1044,"Cần có biến thể",HttpStatus.BAD_REQUEST),
    INVALID_REQUEST(1047,"Thiếu dữ liệu",HttpStatus.BAD_REQUEST),
    PRODUCT_UNAVAILABLE(1068, "Sản phẩm không có sẵn", HttpStatus.BAD_REQUEST),

            ;
    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
