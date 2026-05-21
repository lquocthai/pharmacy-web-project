package com.quocthai.pharmacy_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import jakarta.validation.constraints.Pattern;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateAddressRequest {

    @NotBlank(message = "FIELD_REQUIRED")
    String fullName;

    @NotBlank(message = "FIELD_REQUIRED")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9}$", message = "INVALID_PHONE_NUMBER")
    String phone;

    @NotBlank(message = "FIELD_REQUIRED")
    String province;

    @NotBlank(message = "FIELD_REQUIRED")
    String district;

    @NotBlank(message = "FIELD_REQUIRED")
    String ward;

    @NotNull(message = "FIELD_REQUIRED")
    int provinceId;

    @NotNull(message = "FIELD_REQUIRED")
    int districtId;

    @NotBlank(message = "FIELD_REQUIRED")
    String wardCode;

    @NotBlank(message = "FIELD_REQUIRED")
    String addressDetail;

    boolean isDefault;
    String label;
}
