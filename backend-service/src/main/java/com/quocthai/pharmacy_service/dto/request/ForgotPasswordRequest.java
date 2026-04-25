package com.quocthai.pharmacy_service.dto.request;


import jakarta.validation.constraints.Email;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@AllArgsConstructor
public class ForgotPasswordRequest {
    @Email(message = "EMAIL_INVALID")
    String email;
}
