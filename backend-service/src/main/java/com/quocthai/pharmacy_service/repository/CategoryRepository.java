package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.Category;
import com.quocthai.pharmacy_service.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository  extends JpaRepository<Category, String> {
    // Lấy tất cả sản phẩm thuộc danh mục cha HOẶC danh mục con dựa vào slug của danh mục cha
    @Query("SELECT p FROM Product p WHERE p.category.slug = :slug OR p.category.parent.slug = :slug")
    List<Product> findAllProductsByParentOrChildSlug(@Param("slug") String slug);

    Optional<Category> findBySlug(String slug);
}

