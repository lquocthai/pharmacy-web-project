package com.quocthai.pharmacy_service.service;

import com.cloudinary.Cloudinary;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CloudinaryService {

    Cloudinary cloudinary;

    /**
     * Upload file lên Cloudinary vào folder chỉ định.
     *
     * @param file   file cần upload
     * @param folder ví dụ: "pharmacy/products" hoặc "pharmacy/chat"
     * @return secure_url của file đã upload
     */
    public String uploadFile(MultipartFile file, String folder) {
        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    Map.of("folder", folder)
            );
            return uploadResult.get("secure_url").toString();
        } catch (IOException e) {
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }
    // upload song song
    public String uploadFile2(MultipartFile file, String folder) {
        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getInputStream(),
                    Map.of("folder", folder)
            );

            return uploadResult.get("secure_url").toString();
        } catch (IOException e) {
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    /**
     * Overload giữ nguyên folder mặc định để không break code cũ.
     */
    public String uploadFile(MultipartFile file) {
        return uploadFile(file, "pharmacy/products");
    }

    /**
     * Xóa file theo publicId.
     */
    public void delete(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, Map.of());
        } catch (IOException e) {
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }
}
