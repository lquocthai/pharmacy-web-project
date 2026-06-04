package com.quocthai.pharmacy_service.configuration;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket + STOMP configuration.
 *
 * Topics:
 *   /topic/conversations          — broadcast khi waiting-list thay đổi (dược sĩ dùng)
 *   /topic/conversation/{id}      — chat room realtime của 1 conversation
 *   /user/queue/errors            — lỗi gửi về riêng cho client gây ra lỗi
 *
 * App destinations (client gửi):
 *   /app/chat.send                — gửi tin nhắn trong conversation
 *   /app/conversation.close       — user kết thúc tư vấn
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtChannelInterceptor jwtChannelInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // production: thay bằng domain cụ thể
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Client publish đến /app/**
        registry.setApplicationDestinationPrefixes("/app");
        // Simple in-memory broker phục vụ /topic/** và /queue/**
        registry.enableSimpleBroker("/topic", "/queue");
        // Prefix cho @SendToUser / convertAndSendToUser
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // JwtChannelInterceptor validate JWT tại CONNECT, tạo Principal
        registration.interceptors(jwtChannelInterceptor);
    }
}
