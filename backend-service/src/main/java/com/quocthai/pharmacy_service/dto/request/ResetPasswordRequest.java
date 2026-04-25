package com.quocthai.pharmacy_service.dto.request;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
// setdefaults for field is private
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResetPasswordRequest {
    @Email(message = "EMAIL_INVALID")
    String email;
    @Size(min = 8, message = "PASSWORD_INVALID")
    String newPassword;
}
