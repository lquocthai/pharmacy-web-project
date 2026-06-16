package com.quocthai.pharmacy_service.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateRatingRequest {

    @NotBlank(message = "productId không được để trống")
    String productId;

    @Min(value = 1, message = "RATING_STAR_INVALID")
    @Max(value = 5, message = "RATING_STAR_INVALID")
    int star;

    String comment;
}
