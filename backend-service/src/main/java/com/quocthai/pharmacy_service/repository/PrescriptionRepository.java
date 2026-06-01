package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.constants.PrescriptionStatus;
import com.quocthai.pharmacy_service.entity.Prescription;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
