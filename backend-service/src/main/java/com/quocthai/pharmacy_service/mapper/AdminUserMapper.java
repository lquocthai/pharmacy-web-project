package com.quocthai.pharmacy_service.mapper;

import com.quocthai.pharmacy_service.dto.admin.response.AdminUserDetailResponse;
import com.quocthai.pharmacy_service.dto.response.UserAddressResponse;
import com.quocthai.pharmacy_service.entity.User;
import com.quocthai.pharmacy_service.entity.UserAddress;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AdminUserMapper {

    AdminUserDetailResponse toAdminUserDetailResponse(User user);

    UserAddressResponse toUserAddressResponse(
            UserAddress address
    );
}
