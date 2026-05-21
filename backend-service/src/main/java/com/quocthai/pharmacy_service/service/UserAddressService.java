package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.dto.request.CreateAddressRequest;
import com.quocthai.pharmacy_service.dto.request.UpdateAddressRequest;
import com.quocthai.pharmacy_service.dto.response.UserAddressResponse;
import com.quocthai.pharmacy_service.entity.User;
import com.quocthai.pharmacy_service.entity.UserAddress;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.mapper.UserMapper;
import com.quocthai.pharmacy_service.repository.UserAddressRepository;
import com.quocthai.pharmacy_service.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserAddressService {

    UserAddressRepository userAddressRepository;
    UserRepository userRepository;
    UserMapper userMapper;

    // Giới hạn số địa chỉ tối đa mỗi user
    private static final int MAX_ADDRESSES = 10;

    // ── Lấy email từ JWT ──────────────────────────────────────────────────────
    private String getCurrentUserEmail() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return auth.getName();
    }

    // ── GET /users/addresses ──────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<UserAddressResponse> getMyAddresses() {
        String email = getCurrentUserEmail();
        return userAddressRepository.findByUserEmail(email)
                .stream()
                .map(userMapper::toAddressResponse)
                .toList();
    }

    // ── POST /users/addresses ─────────────────────────────────────────────────
    @Transactional
    public UserAddressResponse createAddress(CreateAddressRequest request) {
        String email = getCurrentUserEmail();
        log.info("Creating user address for email: " + request.getWardCode());

        // Giới hạn số địa chỉ
        long count = userAddressRepository.countByUserEmail(email);
        if (count >= MAX_ADDRESSES) {
            throw new AppException(ErrorCode.ADDRESS_LIMIT_EXCEEDED);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Nếu set làm default → clear tất cả default cũ trước
        if (request.isDefault()) {
            userAddressRepository.clearDefaultByUserEmail(email);
        }

        // Nếu đây là địa chỉ đầu tiên → tự động set default
        // nếu là địa chỉ đầu tiên mà user k chọn default thì count == 0 là true thì chuyển biến này thành true
        boolean shouldBeDefault = request.isDefault() || count == 0;

        UserAddress address = UserAddress.builder()
                .user(user)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .province(request.getProvince())
                .district(request.getDistrict())
                .ward(request.getWard())
                .provinceId(request.getProvinceId())
                .districtId(request.getDistrictId())
                .wardCode(request.getWardCode())
                .addressDetail(request.getAddressDetail())
                .isDefault(shouldBeDefault)
                .label(request.getLabel())
                .build();

        userAddressRepository.save(address);
        return userMapper.toAddressResponse(address);
    }

    // ── PUT /users/addresses/{id} ─────────────────────────────────────────────
    @Transactional
    public UserAddressResponse updateAddress(String addressId, UpdateAddressRequest request) {
        String email = getCurrentUserEmail();
        log.info("updating user address for email: " + request.getWardCode());

        UserAddress address = userAddressRepository.findOwnedAddress(addressId, email)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_EXISTED));

        // Nếu set làm default → clear tất cả default cũ trước
        if (request.isDefault() && !address.isDefault()) {
            userAddressRepository.clearDefaultByUserEmail(email);
        }

        address.setFullName(request.getFullName());
        address.setPhone(request.getPhone());
        address.setProvince(request.getProvince());
        address.setDistrict(request.getDistrict());
        address.setWard(request.getWard());
        address.setProvinceId(request.getProvinceId());
        address.setDistrictId(request.getDistrictId());
        address.setWardCode(request.getWardCode());
        address.setAddressDetail(request.getAddressDetail());
        address.setDefault(request.isDefault());
        address.setLabel(request.getLabel());
        log.info("ward: " + address.getFullName());

        return userMapper.toAddressResponse(address);
    }

    // ── DELETE /users/addresses/{id} ──────────────────────────────────────────
    @Transactional
    public void deleteAddress(String addressId) {
        String email = getCurrentUserEmail();

        UserAddress address = userAddressRepository.findOwnedAddress(addressId, email)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_EXISTED));

        userAddressRepository.delete(address);

    }

    // ── PATCH /users/addresses/{id}/default ───────────────────────────────────
    @Transactional
    public UserAddressResponse setDefault(String addressId) {
        String email = getCurrentUserEmail();

        UserAddress address = userAddressRepository.findOwnedAddress(addressId, email)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_EXISTED));

        // Clear tất cả default cũ rồi set cái mới
        userAddressRepository.clearDefaultByUserEmail(email);
        address.setDefault(true);

        return userMapper.toAddressResponse(address);
    }
}
