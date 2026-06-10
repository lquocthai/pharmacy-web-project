package com.quocthai.pharmacy_service.dto.admin.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminResetPasswordRequest {
    @NotBlank
    @Size(min = 6, max = 10, message = "PASSWORD_INVALID")
    String password;
}
