package com.quocthai.pharmacy_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreatePrescriptionRequest {

    @NotBlank(message = "FIELD_REQUIRED")
    String fullName;

    @NotBlank(message = "FIELD_REQUIRED")
    @Pattern(
            regexp = "^(0|\\+84)[0-9]{9,10}$",
            message = "INVALID_PHONE_NUMBER"
    )
    String phoneNumber;

    String note;
    private List<MultipartFile> images;
}
