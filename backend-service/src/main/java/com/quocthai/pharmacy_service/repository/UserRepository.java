package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    //admin phân trang
    @Query("""
        SELECT u
        FROM User u
        WHERE
            (:active IS NULL OR u.active = :active)
        AND (
            :search IS NULL
            OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
            OR u.phone LIKE CONCAT('%', :search, '%')
        )
    """)
    Page<User> searchUsers(
            @Param("search") String search,
            @Param("active") Boolean active,
            Pageable pageable
    );
    @EntityGraph(attributePaths = {
            "roles",
            "addresses"
    })
    Optional<User> findDetailById(String id);
}
