package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.dto.admin.request.*;
import com.quocthai.pharmacy_service.dto.response.CategoryResponse;
import com.quocthai.pharmacy_service.entity.Category;
import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import com.quocthai.pharmacy_service.repository.CategoryRepository;
import com.quocthai.pharmacy_service.repository.ProductRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CategoryService {
    CategoryRepository categoryRepository;
    ProductRepository productRepository;


    public CategoryResponse getCategoryTreeBySlug(String slug) {
        // 1. Tìm danh mục cha lớn nhất (ví dụ: Dược mỹ phẩm)
        Category parentCategory = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // 2. Chuyển đổi sang cấu trúc cây DTO và trả về
        return convertToDto(parentCategory);
    }

    // Hàm đệ quy để map từ Entity sang DTO xuyên suốt các cấp con, cháu
    private CategoryResponse convertToDto(Category category) {
        if (category == null) return null;

        // Logic lấy parentId an toàn: Nếu có cha thì lấy ID của cha, không có thì để null
        String actualParentId = (category.getParent() != null) ? category.getParent().getId() : null;

        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .icon(category.getIcon())
                .parentId(actualParentId) // <--- Đã sửa gán đúng ID của cha thực sự
                .children(category.getChildren() != null
                        ? category.getChildren().stream().map(this::convertToDto).toList()
                        : Collections.emptyList())
                .build();
    }

    /**
     * Lấy toàn bộ category tree
     * Chỉ lấy category cha (parent = null)
     */
    public List<CategoryResponse> getAll() {

        List<Category> rootCategories =
                categoryRepository.findByParentIsNull();

        return rootCategories.stream()
                .map(this::convertToDto)
                .toList();
    }
    private String generateSlug(String input) {

        if (input == null || input.isBlank()) {
            return "";
        }

        // bỏ dấu tiếng Việt
        String slug = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        // đ -> d
        slug = slug.replace("đ", "d")
                .replace("Đ", "D");

        // lowercase
        slug = slug.toLowerCase();

        // thay ký tự đặc biệt thành -
        slug = slug.replaceAll("[^a-z0-9\\s-]", "");

        // khoảng trắng -> -
        slug = slug.replaceAll("\\s+", "-");

        // nhiều dấu - liên tiếp -> 1 dấu -
        slug = slug.replaceAll("-+", "-");

        // xóa - đầu cuối
        slug = slug.replaceAll("^-|-$", "");

        return slug;
    }
    // 1. TẠO DANH MỤC (Cả danh mục cha và danh mục con)
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.CATEGORY_NOT_EXISTED);
        }
        Category category = Category.builder()
                .name(request.getName())
                .slug(generateSlug(request.getName()))
                .description(request.getDescription())
                .icon(request.getIcon())
                .build();

        // Xử lý nếu có danh mục cha truyền vào
        if (request.getParentId() != null && !request.getParentId().trim().isEmpty()) {
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            category.setParent(parent);
        }

        Category savedCategory = categoryRepository.save(category);
        return convertToDto(savedCategory);
    }

    // 3. LẤY CHI TIẾT MỘT DANH MỤC
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(String id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        return convertToDto(category);
    }
    //update
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryResponse updateCategory(
            String id,
            UpdateParentWithChildrenCategoryRequest request
    ) {
        // =====================================================
        // 1. TÌM CATEGORY CHA
        // =====================================================
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        // =====================================================
        // 2. CHECK TRÙNG TÊN CHA (ĐÃ SỬA: CHỈ TRÙNG NẾU ÔNG CHA KHÁC CŨNG TRÙNG TÊN)
        // =====================================================
        if (!category.getName().equals(request.getName())
                && categoryRepository.existsByNameAndParentIsNull(request.getName())) {
            throw new AppException(ErrorCode.ALREADY_EXISTS);
        }
        category.setName(request.getName());
        category.setSlug(generateSlug(request.getName()));
        category.setDescription(request.getDescription());
        category.setIcon(request.getIcon());

        // =====================================================
        // 3. LOAD CHILDREN
        // =====================================================
        List<Category> children = category.getChildren();
        Map<String, Category> childMap = children.stream()
                .collect(Collectors.toMap(
                        Category::getId,
                        Function.identity()
                ));
        // =====================================================
        // 4. UI KHÔNG GỬI CHILDREN
        // =====================================================
        if (request.getChildren() == null || request.getChildren().isEmpty()) {
            List<String> currentChildIds = children.stream()
                    .map(Category::getId)
                    .toList();
            if (!currentChildIds.isEmpty()
                    && productRepository.existsByCategoryIdIn(currentChildIds)) {
                throw new AppException(ErrorCode.CATEGORY_HAS_PRODUCTS);
            }
            children.clear();
        }
        // =====================================================
        // 5. UI CÓ GỬI CHILDREN
        // =====================================================
        else {
            Set<String> uiChildIds = request.getChildren().stream()
                    .map(ChildCategoryUpdateRequest::getId)
                    .filter(childId -> childId != null && !childId.isBlank())
                    .collect(Collectors.toSet());
            // =================================================
            // 5.1 TÌM CHILD CẦN XÓA
            // =================================================
            List<Category> childrenToDelete = children.stream()
                    .filter(child -> !uiChildIds.contains(child.getId()))
                    .toList();
            if (!childrenToDelete.isEmpty()) {
                List<String> idsToDelete = childrenToDelete.stream()
                        .map(Category::getId)
                        .toList();
                if (productRepository.existsByCategoryIdIn(idsToDelete)) {
                    throw new AppException(ErrorCode.CATEGORY_HAS_PRODUCTS);
                }
                children.removeIf(child ->
                        idsToDelete.contains(child.getId()));
            }

            // =================================================
            // 5.2 GOM TÊN CẦN CHECK TRÙNG (ĐÃ SỬA CHỐNG TRÙNG NGAY TRÊN UI VÀ CHECK THEO CHA)
            // =================================================
            Set<String> namesToCheck = new HashSet<>();
            Set<String> uiDuplicateDefender = new HashSet<>(); // Chống Admin gửi trùng trong cùng 1 Request

            for (ChildCategoryUpdateRequest childReq : request.getChildren()) {

                // Nếu trong 1 JSON gửi lên mà có 2 tên con giống hệt nhau -> Chặn luôn
                if (!uiDuplicateDefender.add(childReq.getName())) {
                    throw new AppException(ErrorCode.ALREADY_EXISTS);
                }

                if (childReq.getId() != null && !childReq.getId().isBlank()) {
                    Category existingChild = childMap.get(childReq.getId());
                    // Nếu sửa tên con cũ
                    if (existingChild != null && !existingChild.getName().equals(childReq.getName())) {
                        namesToCheck.add(childReq.getName());
                    }
                } else {
                    // Nếu là con mới tinh
                    namesToCheck.add(childReq.getName());
                }
            }

            // Thực thi check gộp: Chỉ báo lỗi nếu TÊN TRÙNG nằm trong CÙNG MỘT CHA
            if (!namesToCheck.isEmpty()
                    && categoryRepository.existsByNameInAndParentId(namesToCheck, category.getId())) {
                throw new AppException(ErrorCode.ALREADY_EXISTS);
            }
            // =================================================
            // 5.3 UPDATE / CREATE CHILD
            // =================================================
            for (ChildCategoryUpdateRequest childReq : request.getChildren()) {
                // ---------------------------------------------
                // UPDATE CHILD CŨ
                // ---------------------------------------------
                if (childReq.getId() != null
                        && !childReq.getId().isBlank()) {

                    Category existingChild =
                            childMap.get(childReq.getId());

                    if (existingChild == null) {
                        throw new AppException(
                                ErrorCode.CATEGORY_NOT_FOUND);
                    }
                    existingChild.setName(childReq.getName());
                    existingChild.setSlug(
                            generateSlug(childReq.getName()));
                    existingChild.setDescription(
                            childReq.getDescription());
                    existingChild.setIcon(
                            childReq.getIcon());
                }
                // ---------------------------------------------
                // THÊM CHILD MỚI
                // ---------------------------------------------
                else {
                    Category newChild = Category.builder()
                            .name(childReq.getName())
                            .slug(generateSlug(childReq.getName()))
                            .description(childReq.getDescription())
                            .icon(childReq.getIcon())
                            .parent(category)
                            .build();
                    children.add(newChild);
                }
            }
        }
        Category updatedCategory = categoryRepository.save(category);
        return convertToDto(updatedCategory);
    }

    // 5. XÓA DANH MỤC (Áp dụng CascadeType.ALL sẽ xóa luôn các con của nó)
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deleteCategory(String id) {
        if (!categoryRepository.existsById(id)) {
            throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
        }
        // Check xem bảng products có ông nào đang dùng category_id này không
        if (productRepository.existsByCategoryId(id)) {
            throw new AppException(ErrorCode.CATEGORY_HAS_PRODUCTS);
            // Bắn lỗi: "Không thể xóa danh mục này vì vẫn còn sản phẩm trực thuộc!"
        }
        categoryRepository.deleteById(id);
    }
    @PreAuthorize("hasRole('ADMIN')")
    // thêm danh mục cha và list danh mục con nếu có
    @Transactional
    public CategoryResponse createParentWithChildren(SingleParentWithChildrenCategoryRequest request) {
        // --- BƯỚC 1: KIỂM TRA TRÙNG TÊN HÀNG LOẠT (TỐI ƯU PERFORMANCE) ---
        Set<String> allNamesToCheck = new HashSet<>();
        allNamesToCheck.add(request.getName()); // Thêm tên cha

        if (request.getChildren() != null) {
            request.getChildren().forEach(child -> allNamesToCheck.add(child.getName())); // Thêm các tên con
        }

        if (categoryRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.CATEGORY_EXISTED); // Hoặc bắn message: "Có tên danh mục đã tồn tại trong hệ thống"
        }

        // --- BƯỚC 2: BUILD VÀ LƯU DANH MỤC CHA ---
        Category parentCategory = Category.builder()
                .name(request.getName())
                .slug(generateSlug(request.getName()))
                .description(request.getDescription())
                .icon(request.getIcon())
                .children(new ArrayList<>())
                .build();

        // Lưu cha để lấy ID (UUID)
        Category savedParent = categoryRepository.save(parentCategory);

        // --- BƯỚC 3: BUILD VÀ LƯU DANH SÁCH DANH MỤC CON VỚI SAVEALL ---
        if (request.getChildren() != null && !request.getChildren().isEmpty()) {
            List<Category> childEntities = new ArrayList<>();

            for (ChildCategoryRequest childReq : request.getChildren()) {
                Category child = Category.builder()
                        .name(childReq.getName())
                        .slug(generateSlug(childReq.getName()))
                        .description(childReq.getDescription())
                        .icon(childReq.getIcon())
                        .parent(savedParent) // Gán trực tiếp ông cha vừa lưu ở trên vào đây
                        .build();
                childEntities.add(child);
            }

            // Lưu toàn bộ danh mục con bằng 1 câu lệnh Batch Insert duy nhất
            List<Category> savedChildren = categoryRepository.saveAll(childEntities);
            savedParent.setChildren(savedChildren);
        }

        return convertToDto(savedParent);
    }

}
