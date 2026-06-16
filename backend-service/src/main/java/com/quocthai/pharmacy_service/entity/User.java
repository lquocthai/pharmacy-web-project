package com.quocthai.pharmacy_service.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
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
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String username;
    String email;
    String password;
    String phone;
    String sex;
    LocalDate dob;

    @Enumerated(EnumType.STRING)
    AuthProvider provider;

    @Column(name = "provider_id")
    String providerId;

    @ManyToMany
    Set<Role> roles;

    // Địa chỉ tách ra bảng riêng
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<UserAddress> addresses = new ArrayList<>();

    boolean active = false;
}
