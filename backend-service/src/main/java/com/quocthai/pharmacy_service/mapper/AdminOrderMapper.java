package com.quocthai.pharmacy_service.mapper;

import com.quocthai.pharmacy_service.dto.admin.response.AdminOrderResponse;
import com.quocthai.pharmacy_service.entity.Order;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AdminOrderMapper {

    @Mapping(target = "customerName", source = "user.username")
    @Mapping(target = "customerPhone", source = "user.phone")
    AdminOrderResponse toAdminOrderResponse(Order order);
}