package com.quocthai.pharmacy_service.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.quocthai.pharmacy_service.constants.AuthProvider;
import com.quocthai.pharmacy_service.constants.PredefinedRole;
import com.quocthai.pharmacy_service.dto.request.AuthenticationRequest;
import com.quocthai.pharmacy_service.dto.request.IntrospectRequest;
import com.quocthai.pharmacy_service.dto.request.LogoutRequest;
import com.quocthai.pharmacy_service.dto.request.RefreshRequest;
import com.quocthai.pharmacy_service.dto.response.AuthenticationResponse;
import com.quocthai.pharmacy_service.dto.response.IntrospectResponse;
import com.quocthai.pharmacy_service.entity.InvalidateToken;
import com.quocthai.pharmacy_service.entity.Role;
import com.quocthai.pharmacy_service.entity.User;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.mapper.UserMapper;
import com.quocthai.pharmacy_service.repository.InvalidateTokenRepository;
import com.quocthai.pharmacy_service.repository.RoleRepository;
import com.quocthai.pharmacy_service.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {
    UserRepository userRepository;
    InvalidateTokenRepository invalidateTokenRepository;
    RoleRepository roleRepository;
    UserMapper userMapper;

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

    @NonFinal
    @Value("${jwt.valid-duration}") // Thường là 3600 (1 giờ)
    protected long VALID_DURATION;

    @NonFinal
    @Value("${jwt.refreshable-duration}") // Thường là 86400 (24 giờ) hoặc hơn
    protected long REFRESHABLE_DURATION;

    @NonFinal
    @Value("${outbound.google.client-id}")
    protected String GOOGLE_CLIENT_ID;

    // 1. Xác thực đăng nhập
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        log.info("email: {}", request.getEmail());
        log.info("pass: {}", request.getPassword());
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if(!user.isActive()){
            throw new AppException(ErrorCode.USER_LOCKED);
        }
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (!authenticated) throw new AppException(ErrorCode.INVALID_CREDENTIALS);

        // Tạo đồng thời cả 2 loại Token
        var accessToken = generateToken(user, false);
        var refreshToken = generateToken(user, true);

        return AuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userMapper.toUserResponse(user))
                .authenticated(true)
                .build();
    }

    public AuthenticationResponse refreshToken(RefreshRequest request)
            throws ParseException, JOSEException {

        // ❌ BỎ hoàn toàn đoạn invalidate accessToken

        // 1. Verify refresh token
        var signedRefreshToken = verifyToken(request.getRefreshToken(), true);

        // 2. Lấy jti của refresh token
        String jit = signedRefreshToken.getJWTClaimsSet().getJWTID();
        Date expiryTime = signedRefreshToken.getJWTClaimsSet().getExpirationTime();

        // 3. Check xem token đã bị revoke chưa
        boolean isUsed = invalidateTokenRepository.existsById(jit);
        if (isUsed) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // 4. Invalidate refresh token cũ (rotation)
        invalidateTokenRepository.save(
                InvalidateToken.builder()
                        .id(jit)
                        .expiryTime(expiryTime)
                        .build()
        );

        // 5. Lấy user
        var email = signedRefreshToken.getJWTClaimsSet().getSubject();
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        // 6. Tạo token mới
        var accessToken = generateToken(user, false);
        var refreshToken = generateToken(user, true);

        return AuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .authenticated(true)
                .build();
    }
    // logout
    public void logout(LogoutRequest request) throws JOSEException, ParseException {
        // 1. Vô hiệu hóa Access Token
//        invalidateToken(request.getAccessToken());
        // 2. Vô hiệu hóa Refresh Token
        invalidateToken(request.getRefreshToken());
    }
    // hàm hổ trợ invalidatetoken lưu vào blacklist db
    private void invalidateToken(String token) throws JOSEException, ParseException {
        try {
            // đọc chữ kí
            SignedJWT signedJWT = SignedJWT.parse(token);

            // 2. Lấy thông tin ID và ngày hết hạn
            String jit = signedJWT.getJWTClaimsSet().getJWTID();
            Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

            // 3. Lưu vào Blacklist
            // Dù Token đã hết hạn hay chưa, vẫn lưu JIT vào để đánh dấu "đã hủy"
            invalidateTokenRepository.save(
                    InvalidateToken.builder()
                            .id(jit)
                            .expiryTime(expiryTime)
                            .build()
            );
        } catch (ParseException e) {
            // Nếu Token gửi lên không đúng định dạng JWT (chuỗi rác) thì mặc kệ nó
            log.info("Token format invalid, no need to invalidate");
        }
    }

    // Hàm kiểm tra Token dùng chung
    private SignedJWT verifyToken(String token, boolean isRefresh)
            throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);

        // Kiểm tra chữ ký
        var verified = signedJWT.verify(verifier);
        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

        // Nếu không verify được hoặc thực sự đã hết hạn
        if (!(verified && expiryTime.after(new Date()))) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // Kiểm tra xem token có nằm trong danh sách đen (đã logout/đã refresh)
        if (invalidateTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return signedJWT;
    }

    // 4. Hàm tạo Token (Tách logic cho Access và Refresh)
    public String generateToken(User user, boolean isRefresh) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        // Thời gian hết hạn tùy thuộc vào loại Token
        long duration = isRefresh ? REFRESHABLE_DURATION : VALID_DURATION;

        JWTClaimsSet.Builder builder = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .issuer("thaidui.com")
                .issueTime(new Date())
                .expirationTime(new Date(Instant.now().plus(duration, ChronoUnit.SECONDS).toEpochMilli()))
                .jwtID(UUID.randomUUID().toString())
                .claim("username", user.getUsername());

        // Chỉ Access Token mới cần chứa Scope (Roles/Permissions) để xử lý phân quyền nhanh
        if (!isRefresh) {
            builder.claim("scope", buildScope(user));
        }

        JWTClaimsSet jwtClaimsSet = builder.build();
        Payload payload = new Payload(jwtClaimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Cannot create token", e);
            throw new RuntimeException(e);
        }
    }

    private String buildScope(User user) {
        StringJoiner stringJoiner = new StringJoiner(" ");
        if (!CollectionUtils.isEmpty(user.getRoles())) {
            user.getRoles().forEach(role -> stringJoiner.add("ROLE_" + role.getName()));
        }
        return stringJoiner.toString();
    }

    public IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException {
        var token = request.getToken();
        boolean isValid = true;
        try {
            verifyToken(token, false);
        } catch (AppException e) {
            isValid = false;
        }
        return IntrospectResponse.builder().valid(isValid).build();
    }
    public AuthenticationResponse loginWithGoogle(String idTokenString) {
        try {
            // 1. Verify Token gửi từ Frontend
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(GOOGLE_CLIENT_ID))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) throw new AppException(ErrorCode.UNAUTHENTICATED);

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String providerId = payload.getSubject(); // provider id

            // 2. Tìm user hoặc không có user thì tạo user mới
            User user = userRepository.findByEmail(email).map(existingUser -> {
                // Nếu User đã tồn tại nhưng chưa liên kết Google (provider là DEFAULT)
                if (!AuthProvider.GOOGLE.equals(existingUser.getProvider())) {
                    log.info("Nâng cấp liên kết Google cho tài khoản: {}", email);
                    existingUser.setProvider(AuthProvider.GOOGLE);
                    existingUser.setProviderId(providerId);
                    return userRepository.save(existingUser);
                }
                return existingUser;
            }).orElseGet(() -> {
                // Nếu chưa có bất kỳ tài khoản nào với Email này -> Tạo mới hoàn toàn
                log.info("Tạo tài khoản mới từ Google: {}", email);
                User newUser = User.builder()
                        .email(email)
                        .username(name)
                        .provider(AuthProvider.GOOGLE)
                        .providerId(providerId)
                        .active(true)
                        .build();

                // Gán Role mặc định
                HashSet<Role> roles = new HashSet<>();
                roleRepository.findById(PredefinedRole.USER_ROLE).ifPresent(roles::add);
                newUser.setRoles(roles);

                return userRepository.save(newUser);
            });

            var accessToken = generateToken(user, false);
            var refreshToken = generateToken(user, true);

            return AuthenticationResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .authenticated(true)
                    .user(userMapper.toUserResponse(user))
                    .build();

        } catch (Exception e) {
            log.error("Google Login Error: {}", e.getMessage());
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }
}
