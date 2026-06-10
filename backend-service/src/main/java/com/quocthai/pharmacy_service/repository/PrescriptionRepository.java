package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.constants.PrescriptionStatus;
import com.quocthai.pharmacy_service.entity.Prescription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository
        extends JpaRepository<Prescription, String> {
    @EntityGraph(attributePaths = "images")
    List<Prescription> findByCustomerIdOrderByCreatedAtDesc(
            String customerId
    );

    @EntityGraph(attributePaths = "images")
    List<Prescription> findByCustomerIdAndStatusOrderByCreatedAtDesc(
            String customerId,
            PrescriptionStatus status
    );

    Optional<Prescription> findByIdAndCustomerEmail(
            String id,
            String email
    );

    // 1. Query phân trang lấy ID (Tránh lỗi fetch join với Pageable)
    @Query("SELECT p.id FROM Prescription p WHERE " +
            "(:fullName IS NULL OR LOWER(p.fullName) LIKE LOWER(CONCAT('%', :fullName, '%'))) AND " +
            "(:status IS NULL OR p.status = :status)")
    Page<String> findIdsWithFilter(@Param("fullName") String fullName,
                                   @Param("status") PrescriptionStatus status,
                                   Pageable pageable);

    // 2. Query Fetch Join bằng danh sách ID thu được để trị dứt điểm N+1
    @Query("SELECT DISTINCT p FROM Prescription p " +
            "LEFT JOIN FETCH p.images " +
            "WHERE p.id IN :ids")
    List<Prescription> findPrescriptionsWithImagesByIds(@Param("ids") List<String> ids);
}
