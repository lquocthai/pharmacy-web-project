package com.quocthai.pharmacy_service.dto.response;

import com.quocthai.pharmacy_service.constants.AuthProvider;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    String id;        // Nên là UUID String
    String username;
    String email;     // Bổ sung thêm
    LocalDate dob;
    String phone;     // Cần cho giao hàng thuốc
    String address;
    String sex;
    AuthProvider authProvider;
    String provider;
    Set<RoleResponse> roles;
}