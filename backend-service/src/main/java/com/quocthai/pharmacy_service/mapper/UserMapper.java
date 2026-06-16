package com.quocthai.pharmacy_service.mapper;

import com.quocthai.pharmacy_service.dto.request.UserCreationRequest;
import com.quocthai.pharmacy_service.dto.request.UserUpdateRequest;
import com.quocthai.pharmacy_service.dto.response.UserAddressResponse;
import com.quocthai.pharmacy_service.dto.response.UserResponse;
import com.quocthai.pharmacy_service.entity.User;
import com.quocthai.pharmacy_service.entity.UserAddress;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "addresses", ignore = true)
    User toUser(UserCreationRequest request);

    UserResponse toUserResponse(User user);

    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "addresses", ignore = true)
    void updateUser(@MappingTarget User user, UserUpdateRequest request);

    // Map UserAddress entity → UserAddressResponse
    @Mapping(target = "fullAddress",
        expression = "java(address.getAddressDetail() + \", \" + address.getWard() + \", \" + address.getDistrict() + \", \" + address.getProvince())")
    UserAddressResponse toAddressResponse(UserAddress address);
}
