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
// setdefaults for field is private
@FieldDefaults(level = AccessLevel.PRIVATE)

// giúp khởi tạo đối tượng khng cần new
public class UserCreationRequest {
    @Email(message = "EMAIL_INVALID") // Kiểm tra định dạng email chuẩn
    String email;

    // validation cho password ít nhất 8 kí tự
    @Size(min = 6, max = 10, message = "PASSWORD_INVALID")
    String password;

    @Size(min = 3, message = "USERNAME_INVALID")
    String username;

    String address;
    LocalDate dob;
}
