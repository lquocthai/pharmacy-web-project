package com.quocthai.pharmacy_service.configuration;

import com.quocthai.pharmacy_service.constants.AuthProvider;
import com.quocthai.pharmacy_service.constants.PredefinedRole;
import com.quocthai.pharmacy_service.entity.Role;
import com.quocthai.pharmacy_service.entity.User;
import com.quocthai.pharmacy_service.repository.RoleRepository;
import com.quocthai.pharmacy_service.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;

@RequiredArgsConstructor // khai báo constructor cho các biến khai báo final (thay thế cho
// autowired)
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Configuration
@Slf4j
public class ApplicationInitConfig {
    private PasswordEncoder passwordEncoder;
    @NonFinal
    static final String ADMIN_USER_NAME = "admin";

    @NonFinal
    static final String ADMIN_PASSWORD = "admin";

    @Bean
    // annotation giup deu kien de init cai bean len hay khong
    // bean nay chi init len khi spring.datasource.driverClassName = com.mysql.cj.jdbc.Driver
    @ConditionalOnProperty(
            prefix = "spring",
            value = "datasource.driver-class-name",
            havingValue = "com.mysql.cj.jdbc.Driver")
    ApplicationRunner applicationRunner(
            UserRepository userRepository, RoleRepository roleRepository) {
        log.info("init application run");
        return args -> {
            if (userRepository.findByUsername("admin").isEmpty()) {

                roleRepository.save(Role.builder()
                        .name(PredefinedRole.USER_ROLE)
                        .description("User role")
                        .build());

                roleRepository.save(Role.builder()
                        .name(PredefinedRole.PHARMACIST_ROLE)
                        .description("pharmacist role")
                        .build());

                Role adminRole = roleRepository.save(Role.builder()
                        .name(PredefinedRole.ADMIN_ROLE)
                        .description("Admin role")
                        .build());
                var roles = new HashSet<Role>();
                roles.add(adminRole);
                User user =
                        User.builder()
                                .username(ADMIN_USER_NAME)
                                .password(passwordEncoder.encode(ADMIN_PASSWORD))
                                .email("lethai035600@gmail.com")
                                .active(true)
                                .provider(AuthProvider.DEFAULT)
                                .roles(roles)
                                .build();
                userRepository.save(user);
                log.warn("admin user has been created with default password : admin, please change it");
            }
        };
    }
}
