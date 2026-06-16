package com.quocthai.pharmacy_service.dto.response;

import com.quocthai.pharmacy_service.constants.AuthProvider;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    String id;
    String username;
    String email;
    LocalDate dob;
    String phone;
    String sex;
    AuthProvider authProvider;
    String provider;
    boolean active;
    Set<RoleResponse> roles;
}