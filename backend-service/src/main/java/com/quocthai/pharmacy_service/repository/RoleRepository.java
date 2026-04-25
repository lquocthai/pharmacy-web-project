package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.Role;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoleRepository extends CrudRepository<Role, String> {
}
