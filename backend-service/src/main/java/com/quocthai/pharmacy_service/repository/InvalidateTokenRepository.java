package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.InvalidateToken;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InvalidateTokenRepository extends CrudRepository<InvalidateToken, String> {
}
