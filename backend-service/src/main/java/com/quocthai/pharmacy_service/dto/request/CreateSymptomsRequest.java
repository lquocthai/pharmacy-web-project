package com.quocthai.pharmacy_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateSymptomsRequest {

    @NotNull(message = "Danh sách triệu chứng không được null")
    List<String> names;
}
