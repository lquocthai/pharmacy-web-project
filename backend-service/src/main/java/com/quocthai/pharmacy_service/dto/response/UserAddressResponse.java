package com.quocthai.pharmacy_service.dto.response;

import jakarta.persistence.Column;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserAddressResponse {
    String id;
    String fullName;
    String phone;
    String province;
    String district;
    String ward;
    int provinceId;
    int districtId;
    String wardCode;
    String addressDetail;
    boolean defaultAddress;
    String label;
    // Địa chỉ đầy đủ dạng chuỗi để hiển thị nhanh
    String fullAddress;
}
