package com.quocthai.pharmacy_service.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
// trả về nếu json nào null thì k hiện
public class ApiResponse<T> {
    // <T> biễu diễn cho mọi kiểu dữ liệu trả về
    int code = 1000;
    String message;
    T result;
}