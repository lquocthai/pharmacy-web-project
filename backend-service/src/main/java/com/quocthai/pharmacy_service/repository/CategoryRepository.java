package com.quocthai.pharmacy_service.repository;

import com.quocthai.pharmacy_service.entity.Category;
import com.quocthai.pharmacy_service.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository  extends JpaRepository<Category, String> {
    // Lấy tất cả sản phẩm thuộc danh mục cha HOẶC danh mục con dựa vào slug của danh mục cha
    @Query("SELECT p FROM Product p WHERE p.category.slug = :slug OR p.category.parent.slug = :slug")
    List<Product> findAllProductsByParentOrChildSlug(@Param("slug") String slug);

    Optional<Category> findBySlug(String slug);

    List<Category> findByParentIsNull();

    boolean existsByName(String name);

    boolean existsByNameIn(Collection<String> names);
//    boolean existsByNameInAndParentId(Collection<String> names, String parentId);

    // 1. Check trùng tên Cha: Chỉ tìm những ông là danh mục GỐC (parent_id IS NULL)
    @Query("SELECT COUNT(c) > 0 FROM Category c WHERE c.name = :name AND c.parent IS NULL")
    boolean existsByNameAndParentIsNull(@Param("name") String name);

    // 2. Check trùng tên Con: Ép buộc phải THỎA MÃN CẢ HAI (Tên nằm trong danh sách AND phải cùng cha)
    @Query("SELECT COUNT(c) > 0 FROM Category c WHERE c.name IN :names AND c.parent.id = :parentId")
    boolean existsByNameInAndParentId(@Param("names") Collection<String> names, @Param("parentId") String parentId);
}

