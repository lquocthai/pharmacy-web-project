package com.quocthai.pharmacy_service.controller;


import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.FileUploadResponse;
import com.quocthai.pharmacy_service.service.CloudinaryService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/files")
public class FileController {
    CloudinaryService cloudinaryService;
    @PostMapping("/upload")
    public ApiResponse<FileUploadResponse> upload(@RequestParam MultipartFile file) {

        String url = cloudinaryService.uploadFile(file);

        return ApiResponse.<FileUploadResponse>builder()
                .result(new FileUploadResponse(url))
                .build();
    }
}
