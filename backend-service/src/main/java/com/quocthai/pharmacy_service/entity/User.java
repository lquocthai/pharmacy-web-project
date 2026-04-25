package com.quocthai.pharmacy_service.entity;

import java.time.LocalDate;
import java.util.Set;

import com.quocthai.pharmacy_service.constants.AuthProvider;
import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID) // random id
    String id;

    // xu li dc concurrent khong phan biet chu hoa chu thuong
//    @Column(
//            name = "username",
//            unique = true,
//            columnDefinition = "VARCHAR(255) COLLATE utf8mb4_unicode_ci")
    String username;
    String email;
    String password;
    String phone;
    String address;
    String sex;
    LocalDate dob;
    @Enumerated(EnumType.STRING)
    AuthProvider provider;
    @Column(name = "provider_id")
    String providerId;
    // dùng set để giá trị nó là duy nhất k bị trùng như list
    // tao bang user_roles co khoa chinh la user_id va roles_name
    @ManyToMany Set<Role> roles;
    boolean active = false;
}
