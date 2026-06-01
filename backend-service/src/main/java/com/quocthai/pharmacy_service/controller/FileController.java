package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.FileUploadResponse;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.service.CloudinaryService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/files")
public class FileController {

    CloudinaryService cloudinaryService;

    /** Kích thước tối đa: 10 MB */
    static final long MAX_FILE_SIZE = 5 * 1024 * 1024L;

    /** Các MIME type được phép upload trong chat */
    static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    /**
     * Upload file cho sản phẩm (admin).
     * POST /files/upload
     */
    @PostMapping("/upload")
    public ApiResponse<FileUploadResponse> upload(@RequestParam MultipartFile file) {
        validateFile(file);
        String url = cloudinaryService.uploadFile(file, "pharmacy/products");
        return ApiResponse.<FileUploadResponse>builder()
                .result(new FileUploadResponse(url))
                .build();
    }

    /**
     * Upload file / ảnh trong chat.
     * POST /files/upload/chat
     */
    @PostMapping("/upload/chat")
    public ApiResponse<FileUploadResponse> uploadChat(@RequestParam MultipartFile file) {
        validateFile(file);
        String url = cloudinaryService.uploadFile(file, "pharmacy/chat");
        return ApiResponse.<FileUploadResponse>builder()
                .result(new FileUploadResponse(url))
                .build();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private void validateFile(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ErrorCode.FILE_SIZE_EXCEEDED);
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new AppException(ErrorCode.FILE_TYPE_NOT_ALLOWED);
        }
    }
}
