package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.constants.AuthProvider;
import com.quocthai.pharmacy_service.constants.PredefinedRole;
import com.quocthai.pharmacy_service.dto.admin.request.AdminCreateUserRequest;
import com.quocthai.pharmacy_service.dto.admin.request.AdminUpdateRoleRequest;
import com.quocthai.pharmacy_service.dto.admin.response.AdminUserDetailResponse;
import com.quocthai.pharmacy_service.dto.request.ResendOtpRequest;
import com.quocthai.pharmacy_service.dto.request.UserCreationRequest;
import com.quocthai.pharmacy_service.dto.request.UserUpdateRequest;
import com.quocthai.pharmacy_service.dto.request.VerifyOtpRequest;
import com.quocthai.pharmacy_service.dto.response.PageResponse;
import com.quocthai.pharmacy_service.dto.response.UserResponse;
import com.quocthai.pharmacy_service.entity.Role;
import com.quocthai.pharmacy_service.entity.User;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.mapper.AdminUserMapper;
import com.quocthai.pharmacy_service.mapper.UserMapper;
import com.quocthai.pharmacy_service.repository.RoleRepository;
import com.quocthai.pharmacy_service.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.concurrent.TimeUnit;
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
    UserRepository userRepository;
    RoleRepository roleRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    StringRedisTemplate stringRedisTemplate;
    EmailService emailService;
    AdminUserMapper adminUserMapper;
    Random random = new Random();

    public String register(UserCreationRequest request) {
        log.info("Service: Registering user with email: {}", request.getEmail());
        if (userRepository.existsByEmail(request.getEmail())) {
            log.info("Service: service error: {}", request.getEmail());
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }
        log.info("Service: service error 1: {}", request.getEmail());
        // 2. Tạo mã OTP 6 số ngẫu nhiên
        String otpCode = String.format("%06d", random.nextInt(999999));
        // 3. Lưu OTP vào Redis với Key là "OTP:email", hết hạn sau 1 phút
        String redisKey = "OTP:" + request.getEmail();
        stringRedisTemplate.opsForValue().set(redisKey, otpCode, 1, TimeUnit.MINUTES);
        // 4. Lưu User vào DB nhưng set ACTIVE = FALSE (Cần thêm trường này trong Entity User)
        log.info("Service: service error 2: {}", request.getEmail());
        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setProvider(AuthProvider.DEFAULT);
        user.setActive(false); // Quan trọng: Chưa cho đăng nhập khi chưa verify

        HashSet<Role> roles = new HashSet<>();
        roleRepository.findById(PredefinedRole.USER_ROLE).ifPresent(roles::add);
        user.setRoles(roles);
        log.info("Service: service error 3: {}", request.getEmail());
        userRepository.save(user);

        // 5. Gửi Mail chứa OTP cho khách hàng
        emailService.sendOtpEmail(request.getEmail(), otpCode);
        return "Vui lòng kiểm tra Email để nhận mã xác thực.";
    }

    // verify otp
    public UserResponse verifyOtp(VerifyOtpRequest otpRequest) {

        String redisKey = "OTP:" + otpRequest.getEmail();
        String storedOtp = stringRedisTemplate.opsForValue().get(redisKey);

        if (storedOtp == null) {
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }

        if (!storedOtp.equals(otpRequest.getOtp())) {
            throw new AppException(ErrorCode.OTP_INVALID);
        }

        User user = userRepository.findByEmail(otpRequest.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        user.setActive(true);
        userRepository.save(user);

        stringRedisTemplate.delete(redisKey);

        return userMapper.toUserResponse(user);
    }
//    resend otp
    public String resendOtp(ResendOtpRequest request) {
        String email = request.getEmail();
        String cooldownKey = "OTP_COOLDOWN:" + email;
        String attemptKey = "OTP_ATTEMPTS:" + email;

        // 1. Kiểm tra xem có đang trong thời gian Block 10 phút không (nếu gửi > 5 lần)
        String attempts = stringRedisTemplate.opsForValue().get(attemptKey);
        if (attempts != null && Integer.parseInt(attempts) >= 5) {
            throw new AppException(ErrorCode.TOO_MANY_REQUESTS_OTP);
        }

        // 2. Kiểm tra Cooldown 60s
        if (Boolean.TRUE.equals(stringRedisTemplate.hasKey(cooldownKey))) {
            throw new AppException(ErrorCode.OTP_COOLDOWN);
        }

        // 3. Kiểm tra xem User có tồn tại và đang ở trạng thái chờ Verify không
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (user.isActive()) {
            throw new AppException(ErrorCode.USER_ALREADY_ACTIVE);
        }

        // 4. Tạo OTP mới
        String newOtpCode = String.format("%06d", random.nextInt(999999));

        // 5. Lưu vào Redis
        // - Lưu OTP chính (vẫn là 1-5 phút tùy bạn)
        stringRedisTemplate.opsForValue().set("OTP:" + email, newOtpCode, 5, TimeUnit.MINUTES);

        // - Thiết lập Cooldown 60s
        stringRedisTemplate.opsForValue().set(cooldownKey, "lock", 60, TimeUnit.SECONDS);

        // - Tăng số lần thử (Incr) và set block 10p nếu đạt giới hạn
        Long currentAttempts = stringRedisTemplate.opsForValue().increment(attemptKey);
        if (currentAttempts != null && currentAttempts == 1) {
            stringRedisTemplate.expire(attemptKey, 10, TimeUnit.MINUTES);
        }

        // 6. Gửi Email
        emailService.sendOtpEmail(email, newOtpCode);

        log.info("Resent OTP to {}. Attempt: {}", email, currentAttempts);
        return "Mã OTP mới đã được gửi.";
    }
    public UserResponse updateUser(String userId, UserUpdateRequest request) {
        User user =
                userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        userMapper.updateUser(user, request);
//        if (request.getPassword() != null) {
//            user.setPassword(passwordEncoder.encode(request.getPassword()));
//        }
        return userMapper.toUserResponse(userRepository.save(user));
        // tạo hay update hay xóa thì save repository lại
    }
    // my infor
    public UserResponse getMe() {
        var context = SecurityContextHolder.getContext();
        // lấy context get authentication phần getName() là phần sub trong jwt đã tạo
        String email = context.getAuthentication().getName();
        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return userMapper.toUserResponse(user);
    }
    // 1. Yêu cầu quên mật khẩu: Gửi OTP cho User đã tồn tại

    public String forgotPassword(String email) {
        // 1. Kiểm tra xem User có tồn tại không
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // 2. Kiểm tra cooldown 60s trên Redis để chống spam gửi mail
        String cooldownKey = "PW_COOLDOWN:" + email;
        if (Boolean.TRUE.equals(stringRedisTemplate.hasKey(cooldownKey))) {
            throw new AppException(ErrorCode.OTP_COOLDOWN);
        }

        // 3. Sinh mật khẩu mới ngẫu nhiên (Ví dụ: chuỗi gồm 8 ký tự cả chữ và số)
        // Nếu không dùng thư viện kham khảo hàm sinh chuỗi ở dưới
        String newPassword = generateRandomPassword(8);

        // 4. Mã hóa mật khẩu mới và cập nhật vào Database luôn
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // 5. Thiết lập cooldown 60s trên Redis
        stringRedisTemplate.opsForValue().set(cooldownKey, "lock", 60, TimeUnit.SECONDS);

        // 6. Gửi Mail chứa mật khẩu mới cho khách hàng
        // Bạn nên sửa lại tên hàm hoặc tạo hàm mới trong emailService cho đúng ngữ cảnh
        emailService.sendNewPasswordEmail(email, newPassword);

        return "Mật khẩu mới đã được gửi vào Email của bạn. Vui lòng kiểm tra và đổi lại mật khẩu sau khi đăng nhập.";
    }

    private String generateRandomPassword(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            int index = random.nextInt(chars.length());
            sb.append(chars.charAt(index));
        }
        return sb.toString();
    }

    // chức năng admin
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<UserResponse> getUsers(
            int page,
            int size,
            String search,
            Boolean active
    ) {
        Pageable pageable = PageRequest.of(page, size);

        Page<User> users = userRepository.searchUsers(
                search,
                active,
                pageable
        );

        List<UserResponse> content = users.getContent()
                .stream()
                .map(userMapper::toUserResponse)
                .toList();

        return PageResponse.<UserResponse>builder()
                .content(content)
                .page(users.getNumber())
                .size(users.getSize())
                .totalElements(users.getTotalElements())
                .totalPages(users.getTotalPages())
                .last(users.isLast())
                .build();
    }

    // lấy chi tiết user admin
    @PreAuthorize("hasRole('ADMIN')")
    public AdminUserDetailResponse getUserDetail(String userId) {

        User user = userRepository.findDetailById(userId)
                .orElseThrow(() ->
                        new AppException(ErrorCode.USER_NOT_EXISTED));

        return adminUserMapper.toAdminUserDetailResponse(user);
    }
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse createUser(AdminCreateUserRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }
        Role role = roleRepository.findById(request.getRole())
                .orElseThrow(() ->
                        new AppException(ErrorCode.ROLE_NOT_FOUND));

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .phone(request.getPhone())
                .sex(request.getSex())
                .dob(request.getDob())
                .password(passwordEncoder.encode(request.getPassword()))
                .active(Boolean.TRUE.equals(request.getActive()))
                .provider(AuthProvider.DEFAULT)
                .build();
        HashSet<Role> roles = new HashSet<>();
        roles.add(role);

        user.setRoles(roles);
        userRepository.save(user);

        return userMapper.toUserResponse(user);
    }

    // update user admin
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateUser(
            String userId,
            AdminUpdateRoleRequest request
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new AppException(ErrorCode.USER_NOT_EXISTED));
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        User currentUser  = userRepository.findByEmail(auth.getName()).orElseThrow(()->
                new AppException((ErrorCode.USER_NOT_EXISTED)));
        if(userId.equals(currentUser.getId())){
            throw new AppException(ErrorCode.CANNOT_UPDATE_OWN_STATUS);
        }
        if (request.getRole() != null) {
            Role role = roleRepository.findById(request.getRole())
                    .orElseThrow(() ->
                            new AppException(ErrorCode.ROLE_NOT_FOUND));
            HashSet<Role> roles = new HashSet<>();
            roles.add(role);
            user.setRoles(roles);
        }
        userRepository.save(user);

        return userMapper.toUserResponse(user);
    }
    // set quyền
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void updateStatus(String userId, Boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new AppException(ErrorCode.USER_NOT_EXISTED));
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        User currentUser  = userRepository.findByEmail(auth.getName()).orElseThrow(()->
                new AppException((ErrorCode.USER_NOT_EXISTED)));

        if(userId.equals(currentUser .getId())){
            throw new AppException(ErrorCode.CANNOT_UPDATE_OWN_STATUS);
        }
        user.setActive(active);
        userRepository.save(user);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void resetPasswordAdmin(String userId,String password){
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new AppException(ErrorCode.USER_NOT_EXISTED));
        user.setPassword(passwordEncoder.encode(password));
    }
}
