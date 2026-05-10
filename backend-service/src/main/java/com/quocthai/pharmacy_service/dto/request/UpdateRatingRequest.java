package com.quocthai.pharmacy_service.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateRatingRequest {

    @Min(value = 1, message = "RATING_STAR_INVALID")
    @Max(value = 5, message = "RATING_STAR_INVALID")
    int star;

    String comment;
}
