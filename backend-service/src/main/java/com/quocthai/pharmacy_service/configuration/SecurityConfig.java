package com.quocthai.pharmacy_service.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
@EnableWebSecurity
// cấu hình security
// phân quyền
@EnableMethodSecurity
public class SecurityConfig {
    private static final String[] PUBLIC_ENDPOINTS = {
            "/users","/users/register","/users/resend-otp","/users/verify",
            "/auth/token", "/auth/introspect", "/auth/logout", "/auth/refresh",
            "/auth/outbound/authentication/google", "/users/forgot-password","/users/reset-password"
    };

    // WebSocket handshake endpoints (xác thực được xử lý bởi WebSocketAuthInterceptor)
    private static final String[] WS_ENDPOINTS = {
            "/ws/**"
    };

    // Các endpoint GET public (không cần đăng nhập)
    private static final String[] PUBLIC_GET_ENDPOINTS = {
            "/products",
            "/products/**",
            "/products/detail/*",
            "/ratings/product/*",
            "/categories/**",
            "/payments/vnpay-return",
            "/payments/vnpay-ipn",
            "/search/*"
    };

    private final CustomJwtDecoder customJwtDecoder;

    public SecurityConfig(CustomJwtDecoder customJwtDecoder) {
        this.customJwtDecoder = customJwtDecoder;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {
        // cho phép các request này k cần auth
        httpSecurity.authorizeHttpRequests(
                request ->
                        request
                                .requestMatchers(HttpMethod.POST, PUBLIC_ENDPOINTS).permitAll()
                                .requestMatchers(HttpMethod.GET, PUBLIC_GET_ENDPOINTS).permitAll()
                                // WebSocket handshake — xác thực do WebSocketAuthInterceptor xử lý
                                .requestMatchers(WS_ENDPOINTS).permitAll()
                                .anyRequest().authenticated());
        httpSecurity.oauth2ResourceServer(
                oauth2 ->
                        oauth2.jwt(jwtConfigurer ->
                                                jwtConfigurer
                                                        .decoder(customJwtDecoder)
                                                        .jwtAuthenticationConverter(jwtAuthenticationConverter()))
                                .authenticationEntryPoint(
                                        new JwtAuthenticationEntryPoint()) // nếu authen failure sẽ điều hướng đi đâu
                // (trường hợp này trả về error message)
        );
        // tắt csrf để truy cập dc các endpoints public
        httpSecurity.csrf(AbstractHttpConfigurer::disable);
        httpSecurity.cors(httpSecurityCorsConfigurer -> corsFilter());
        return httpSecurity.build();
    }

    // config cors voi frontend
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        config.addAllowedOrigin("http://localhost:5173"); // FE React
        config.addAllowedOrigin("https://quocthaipharmacy.vercel.app");
        config.addAllowedMethod("*");
        config.addAllowedHeader("*");
        config.addAllowedOriginPattern("https://*-vercel.app");
        config.addAllowedOriginPattern("https://*.vercel.app");
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter =
                new JwtGrantedAuthoritiesConverter();
        jwtGrantedAuthoritiesConverter.setAuthorityPrefix("");
        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter);
        return jwtAuthenticationConverter;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }
}

