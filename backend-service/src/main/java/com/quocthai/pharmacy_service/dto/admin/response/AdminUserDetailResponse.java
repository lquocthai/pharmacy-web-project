package com.quocthai.pharmacy_service.dto.admin.response;

import com.quocthai.pharmacy_service.dto.response.RoleResponse;
import com.quocthai.pharmacy_service.dto.response.UserAddressResponse;
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
public class AdminUserDetailResponse {
    String id;
    String username;
    String email;
    String phone;
    String sex;
    LocalDate dob;
    boolean active;

    Set<RoleResponse> roles;

    List<UserAddressResponse> addresses;
}
