package com.quocthai.pharmacy_service.dto.admin.request;

import com.quocthai.pharmacy_service.constants.PredefinedRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminCreateUserRequest {
    @NotBlank
    @Size(min = 3, message = "USERNAME_INVALID")
    String username;

    @Email(message = "EMAIL_INVALID")
    String email;

    String phone;

    String sex;

    LocalDate dob;

    @Size(min = 6, message = "PASSWORD_INVALID")
    String password;

    String role;

    Boolean active;
}