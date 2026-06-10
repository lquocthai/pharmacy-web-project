package com.quocthai.pharmacy_service.dto.request;

import com.quocthai.pharmacy_service.constants.PrescriptionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateStatusRequest {
    @NotNull(message = "STATUS_CANNOT_BE_NULL")
    PrescriptionStatus status;
    String pharmacistNote;
}