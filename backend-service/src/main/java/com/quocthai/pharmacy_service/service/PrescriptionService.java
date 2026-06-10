package com.quocthai.pharmacy_service.service;


import com.quocthai.pharmacy_service.constants.PrescriptionStatus;
import com.quocthai.pharmacy_service.dto.request.CreatePrescriptionRequest;
import com.quocthai.pharmacy_service.dto.request.UpdateStatusRequest;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

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
    @Transactional(readOnly = true)
    public Page<PrescriptionResponse> getPrescriptions(String fullName, PrescriptionStatus status, Pageable pageable) {
        // Bước 1: Phân trang lấy danh sách IDs trước
        Page<String> idPage = prescriptionRepository.findIdsWithFilter(fullName, status, pageable);

        if (idPage.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        // Bước 2: Dùng danh sách IDs đó để FETCH JOIN kèm theo images (Chỉ tốn đúng 1 query này cho list)
        List<Prescription> prescriptions = prescriptionRepository.findPrescriptionsWithImagesByIds(idPage.getContent());

        // Bước 3: Map sang DTO trả về cho client
        List<PrescriptionResponse> content = prescriptions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, idPage.getTotalElements());
    }

    @Transactional
    public PrescriptionResponse updateStatus(String id, UpdateStatusRequest request) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRESCRIPTION_NOT_FOUND));

        prescription.setStatus(request.getStatus());
        if (request.getPharmacistNote() != null) {
            prescription.setPharmacistNote(request.getPharmacistNote());
        }

        // Nếu chuyển sang trạng thái đã tư vấn thì ghi nhận thời gian
        if (request.getStatus() == PrescriptionStatus.CONSULTED) {
            prescription.setConsultedAt(LocalDateTime.now());
        }

        // Lưu cập nhật
        Prescription updated = prescriptionRepository.save(prescription);
        return mapToResponse(updated);
    }

    // Hàm helper chuyển đổi entity -> DTO
    private PrescriptionResponse mapToResponse(Prescription prescription) {
        return PrescriptionResponse.builder()
                .id(prescription.getId())
                .fullName(prescription.getFullName())
                .phoneNumber(prescription.getPhoneNumber())
                .note(prescription.getNote())
                .status(prescription.getStatus())
                .pharmacistNote(prescription.getPharmacistNote())
                .consultedAt(prescription.getConsultedAt())
                .createdAt(prescription.getCreatedAt())
                .updatedAt(prescription.getUpdatedAt())
                .imageUrls(
                        prescription.getImages()
                                .stream()
                                .map(PrescriptionImage::getImageUrl)
                                .toList()
                )
                .build();
    }
}
