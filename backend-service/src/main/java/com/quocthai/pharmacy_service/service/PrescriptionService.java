package com.quocthai.pharmacy_service.service;


import com.quocthai.pharmacy_service.constants.PrescriptionStatus;
import com.quocthai.pharmacy_service.dto.request.CreatePrescriptionRequest;
import com.quocthai.pharmacy_service.dto.response.PrescriptionResponse;
import com.quocthai.pharmacy_service.entity.Prescription;
import com.quocthai.pharmacy_service.entity.PrescriptionImage;
import com.quocthai.pharmacy_service.entity.User;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.repository.PrescriptionRepository;
import com.quocthai.pharmacy_service.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PrescriptionService {
    PrescriptionRepository prescriptionRepository;
    CloudinaryService cloudinaryService;
    UserRepository userRepository;

    private String getCurrentUserEmail() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return auth.getName();
    }
    @Transactional
    public void create(CreatePrescriptionRequest request, List<MultipartFile> images) {
        String email = getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Prescription prescription =
                Prescription.builder()
                        .customer(user)
                        .fullName(request.getFullName())
                        .phoneNumber(request.getPhoneNumber())
                        .note(request.getNote())
                        .status(PrescriptionStatus.PENDING)
                        .build();
        if (images != null && !images.isEmpty()) {

            List<PrescriptionImage> prescriptionImages =
                    images.parallelStream()
                            .map(image -> {
                                String imageUrl =
                                        cloudinaryService.uploadFile(
                                                image,
                                                "pharmacy/prescriptions"
                                        );

                                return PrescriptionImage.builder()
                                        .prescription(prescription)
                                        .imageUrl(imageUrl)
                                        .build();
                            })
                            .toList();

            prescription.getImages().addAll(prescriptionImages);
        }
        prescriptionRepository.save(prescription);
    }

    public List<PrescriptionResponse> getMyPrescriptions(PrescriptionStatus status) {
        String email = getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        List<Prescription> prescriptions;
        if (status == null) {
            prescriptions = prescriptionRepository.findByCustomerIdOrderByCreatedAtDesc(user.getId());
        } else {
            prescriptions = prescriptionRepository
                    .findByCustomerIdAndStatusOrderByCreatedAtDesc(user.getId(), status
            );
        }
        return prescriptions.stream()
                .map(this::toResponse)
                .toList();
    }
    @Transactional(readOnly = true)
    public PrescriptionResponse getById(String id) {
        String email = getCurrentUserEmail();

        Prescription prescription = prescriptionRepository
                .findByIdAndCustomerEmail(id, email)
                .orElseThrow(() -> new AppException(ErrorCode.PRESCRIPTION_NOT_FOUND));

        return toResponse(prescription);
    }

    private PrescriptionResponse toResponse(
            Prescription prescription
    ) {
        return PrescriptionResponse.builder()
                .id(prescription.getId())
                .fullName(prescription.getFullName())
                .phoneNumber(prescription.getPhoneNumber())
                .note(prescription.getNote())
                .status(prescription.getStatus())
                .imageUrls(
                        prescription.getImages()
                                .stream()
                                .map(PrescriptionImage::getImageUrl)
                                .toList()
                )
                .createdAt(prescription.getCreatedAt())
                .build();
    }
}
