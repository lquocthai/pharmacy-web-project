package com.quocthai.pharmacy_service.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCreationRequest {
    @Email(message = "EMAIL_INVALID")
    String email;

    @Size(min = 6, message = "PASSWORD_INVALID")
    String password;

    @Size(min = 3, message = "USERNAME_INVALID")
    String username;

    LocalDate dob;
}
