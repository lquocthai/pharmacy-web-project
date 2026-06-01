package com.quocthai.pharmacy_service.dto.response;

import com.quocthai.pharmacy_service.constants.PrescriptionStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PrescriptionResponse {

    String id;

    String fullName;

    String phoneNumber;

    String note;

    PrescriptionStatus status;

    List<String> imageUrls;

    LocalDateTime createdAt;
}
