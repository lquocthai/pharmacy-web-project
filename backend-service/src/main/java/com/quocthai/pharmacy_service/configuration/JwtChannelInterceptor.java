package com.quocthai.pharmacy_service.configuration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import javax.crypto.spec.SecretKeySpec;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Xác thực JWT tại CONNECT frame của STOMP.
 *
 * Tại sao KHÔNG dùng CustomJwtDecoder:
 *   CustomJwtDecoder gọi AuthenticationService.introspect() — đây là HTTP round-trip
 *   không cần thiết cho WebSocket. Hơn nữa AuthenticationService có thể gây
 *   circular dependency. Ở đây ta chỉ verify chữ ký + expiry bằng NimbusJwtDecoder
 *   trực tiếp — đủ bảo mật cho WS connection.
 *
 * Principal.getName() = email (sub claim).
 * Authorities = scope claim ("ROLE_USER", "ROLE_PHARMACIST", "ROLE_ADMIN").
 */
@Slf4j
@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final NimbusJwtDecoder jwtDecoder;

    public JwtChannelInterceptor(@Value("${jwt.signerKey}") String signerKey) {
        SecretKeySpec key = new SecretKeySpec(signerKey.getBytes(), "HmacSHA512");
        this.jwtDecoder = NimbusJwtDecoder
                .withSecretKey(key)
                .macAlgorithm(MacAlgorithm.HS512)
                .build();
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) return message;

        // Chỉ authenticate tại CONNECT
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("WS CONNECT rejected: missing Authorization header");
                throw new IllegalArgumentException("Missing or invalid Authorization header");
            }

            String token = authHeader.substring(7).trim();

            try {
                Jwt jwt = jwtDecoder.decode(token);

                // scope có dạng "ROLE_USER" hoặc "ROLE_USER ROLE_PHARMACIST"
                String scope = jwt.getClaimAsString("scope");
                List<SimpleGrantedAuthority> authorities = (scope == null || scope.isBlank())
                        ? List.of()
                        : java.util.Arrays.stream(scope.split("\\s+"))
                                .map(SimpleGrantedAuthority::new)
                                .collect(Collectors.toList());

                // sub = email — dùng làm principal.getName()
                String email = jwt.getSubject();

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(email, null, authorities);

                accessor.setUser(auth);
                log.debug("WS CONNECT authenticated: email={}, roles={}", email, authorities);

            } catch (JwtException ex) {
                log.warn("WS CONNECT rejected: invalid JWT — {}", ex.getMessage());
                throw new IllegalArgumentException("Invalid JWT: " + ex.getMessage());
            }
        }

        return message;
    }
}
