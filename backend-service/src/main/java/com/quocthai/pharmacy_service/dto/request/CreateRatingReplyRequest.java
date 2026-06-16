package com.quocthai.pharmacy_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateRatingReplyRequest {

    @NotBlank(message = "Nội dung phản hồi không được để trống")
    String content;
}
