import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import toast from 'react-hot-toast';
import categoryService from '../../services/categoryService';
import productService from '../../services/productService'; // Khai báo service sản phẩm mới

export default function ProductPage() {
    const { slug } = useParams();

    // State của danh mục
    const [categoryTree, setCategoryTree] = useState(null);
    const [categoryLoading, setCategoryLoading] = useState(true);
    const [selectedSub, setSelectedSub] = useState('all'); // 'all' nghĩa là đang chọn danh mục cha cấp 1

    // State của sản phẩm phân trang
    const [products, setProducts] = useState([]);
    const [productLoading, setProductLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    const scrollRef = useRef(null);

    // 1. Tải cây danh mục (Chạy 1 lần duy nhất khi đổi slug trên URL)
    const loadCategoryTree = async (mainSlug) => {
        setCategoryLoading(true);
        try {
            const { data } = await categoryService.getCategoriesTree(mainSlug);
            if (data.code === 0) setCategoryTree(data.result || []);
        } catch (err) {
            toast.error('Không thể tải danh mục sản phẩm');
        } finally {
            setCategoryLoading(false);
        }
    };
    const loadProducts = async (targetSlug, currentPage, isLoadMore = false
    ) => {
        setProductLoading(true);
        try {

            const { data } = await productService.getByCategory(targetSlug, currentPage, 8);
            const pageData = data.result;
            if (isLoadMore) {
                setProducts(prev => [
                    ...prev,
                    ...(pageData.content || [])
                ]);
            } else {
                setProducts(pageData.content || []);
            }
            setHasMore(!pageData.last);
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải sản phẩm');
        } finally {
            setProductLoading(false);
        }
    };


    // Theo dõi khi đổi danh mục chính (Slug trên URL thay đổi)
    useEffect(() => {
        loadCategoryTree(slug);
        setSelectedSub('all'); // Reset về "Tất cả" của danh mục cha
        setPage(0); // Reset trang về 1
        loadProducts(slug, 0, false);
    }, [slug]);

    // Theo dõi khi người dùng click chọn bộ lọc Danh mục con cấp 2
    const handleSubCategoryClick = (subSlug) => {
        setSelectedSub(subSlug);
        setPage(0); // Reset trang về 1

        // Nếu nhấn lại chính danh mục cha ('all') thì lấy theo slug của URL, ngược lại lấy theo subSlug
        const activeSlug = subSlug === 'all' ? slug : subSlug;
        loadProducts(activeSlug, 0, false);
    };

    // Xử lý khi nhấn nút "Xem thêm"
    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        const activeSlug = selectedSub === 'all' ? slug : selectedSub;
        loadProducts(activeSlug, nextPage, true); // Đặt trạng thái isLoadMore = true
    };

    // Xử lý cuộn mượt cho slider danh mục con
    const handleScroll = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollAmount = clientWidth * 0.7;
            scrollRef.current.scrollTo({
                left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
                behavior: 'smooth'
            });
        }
    };
    console.log('products ', products);
    if (categoryLoading) {
        return <div className="container text-center py-5">Đang tải danh mục...</div>;
    }

    return (
        <div className="bg-light min-vh-100 py-3">
            <div className="container-xl">

                {/* ── BREADCRUMB (Đường dẫn) ── */}
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-2" style={{ fontSize: '14px' }}>
                        <li className="breadcrumb-item"><a href="/" className="text-decoration-none text-secondary">Trang chủ</a></li>
                        <li className="breadcrumb-item active text-dark fw-medium" aria-current="page">
                            {categoryTree?.name || 'Danh mục'}
                        </li>
                    </ol>
                </nav>

                {/* ── TIÊU ĐỀ DANH MỤC CHA ── */}
                <h1 className="fw-bold mb-4 text-dark text-start" style={{ fontSize: '28px' }}>
                    {categoryTree?.name}
                </h1>

                {/* ── GRID/SLIDER DANH MỤC CON (CẤP 2) ── */}
                <div className="position-relative mb-4 px-2 d-flex align-items-center">
                    <button
                        className="btn btn-light rounded-circle shadow-sm position-absolute start-0 z-3 d-none d-md-flex align-items-center justify-content-center"
                        style={{ width: '40px', height: '40px', left: '-15px' }}
                        onClick={() => handleScroll('left')}
                    >
                        <FaChevronLeft size={14} className="text-secondary" />
                    </button>

                    <div
                        ref={scrollRef}
                        className="d-flex align-items-center gap-3 overflow-x-auto w-100 pb-2 hide-scrollbar"
                        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
                    >
                        {/* Thẻ "Tất cả" đại diện cho toàn bộ danh mục chính */}
                        <div
                            className={`card flex-shrink-0 text-center border-0 p-3 shadow-sm rounded-3 ${selectedSub === 'all' ? 'border border-2 border-primary fw-bold text-primary' : ''}`}
                            style={{ width: '160px', scrollSnapAlign: 'start', transition: 'all 0.2s', cursor: 'pointer' }}
                            onClick={() => handleSubCategoryClick('all')}
                        >
                            <div className="mb-2 d-flex align-items-center justify-content-center mx-auto" style={{ width: '56px', height: '56px' }}>
                                <img
                                    src="https://cdn.nhathuoclongchau.com.vn/unsafe/96x0/filters:quality(90):format(webp)/smalls/Dung_cu_y_te_8ae0da0bb4.png"
                                    alt="Tất cả"
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                />
                            </div>
                            <span style={{ fontSize: '14px', height: '42px', lineHeight: '42px' }}>Tất cả sản phẩm</span>
                        </div>

                        {/* Duyệt mảng con `children` từ API */}
                        {categoryTree?.children && categoryTree.children.map((child) => (
                            <div
                                key={child.id || child._id}
                                className={`card flex-shrink-0 text-center border-0 p-3 shadow-sm rounded-3 ${selectedSub === child.slug ? 'border border-2 border-primary fw-bold text-primary' : ''}`}
                                style={{ width: '160px', scrollSnapAlign: 'start', transition: 'all 0.2s', cursor: 'pointer' }}
                                onClick={() => handleSubCategoryClick(child.slug)}
                            >
                                <div className="mb-2 d-flex align-items-center justify-content-center mx-auto" style={{ width: '56px', height: '56px' }}>
                                    <img
                                        src={child.icon || 'https://cdn.nhathuoclongchau.com.vn/unsafe/96x0/filters:quality(90):format(webp)/smalls/Dung_cu_y_te_8ae0da0bb4.png'}
                                        alt={child.name}
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                    />
                                </div>
                                <span className="text-dark" style={{ fontSize: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '42px', lineHeight: '21px' }}>
                                    {child.name}
                                </span>
                            </div>
                        ))}
                    </div>

                    <button
                        className="btn btn-light rounded-circle shadow-sm position-absolute end-0 z-3 d-flex align-items-center justify-content-center"
                        style={{ width: '40px', height: '40px', right: '-15px' }}
                        onClick={() => handleScroll('right')}
                    >
                        <FaChevronRight size={14} className="text-secondary" />
                    </button>
                </div>

                {/* ── BỐ CỤC CHÍNH: BỘ LỌC BÊN TRÁI & DANH SÁCH SẢN PHẨM BÊN PHẢI ── */}
                <div className="row">

                    {/* BỘ LỌC NÂNG CAO (Bên trái - Chiếm 3/12 cột ở màn hình lớn) */}
                    <div className="col-10 col-md-3 mb-4 text-start">
                        <div className="bg-white p-3 rounded-3 shadow-sm border-0">
                            <h5 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: '16px' }}>
                                <span className="me-2">☰</span> Bộ lọc nâng cao
                            </h5>
                            <hr className="text-muted my-2" />

                            {/* Đối tượng sử dụng */}
                            <div className="mb-4">
                                <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '14px' }}>Đối tượng sử dụng</h6>
                                <div className="form-check mb-2">
                                    <input className="form-check-input" type="checkbox" defaultChecked id="allCheck" />
                                    <label className="form-check-label" htmlFor="allCheck">Tất cả</label>
                                </div>
                                <div className="form-check mb-2">
                                    <input className="form-check-input" type="checkbox" id="kidCheck" />
                                    <label className="form-check-label" htmlFor="kidCheck">Trẻ em</label>
                                </div>
                                <div className="form-check mb-2">
                                    <input className="form-check-input" type="checkbox" id="adultCheck" />
                                    <label className="form-check-label" htmlFor="adultCheck">Người trưởng thành</label>
                                </div>
                            </div>

                            {/* Giá bán */}
                            <div>
                                <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '14px' }}>Giá bán</h6>
                                <button className="btn btn-outline-secondary btn-sm w-100 text-start mb-2 py-2 px-3 border-light-subtle text-dark bg-light" style={{ fontSize: '13px' }}>Dưới 100.000đ</button>
                                <button className="btn btn-outline-secondary btn-sm w-100 text-start mb-2 py-2 px-3 border-light-subtle text-dark bg-light" style={{ fontSize: '13px' }}>100.000đ đến 300.000đ</button>
                            </div>
                        </div>
                    </div>

                    {/* DANH SÁCH SẢN PHẨM (Bên phải - Chiếm 9/12 cột) */}
                    <div className="col-12 col-md-9">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="text-secondary" style={{ fontSize: '14px' }}>
                                Lưu ý: Thuốc kê đơn và một số sản phẩm sẽ cần tư vấn từ dược sĩ.
                            </span>
                            {/* Sắp xếp nhanh */}
                            <div className="d-flex gap-2 align-items-center">
                                <span className="text-secondary" style={{ fontSize: '14px' }}>Sắp xếp theo:</span>
                                <button className="btn btn-primary btn-sm rounded-pill px-3">Bán chạy</button>
                                <button className="btn btn-light btn-sm rounded-pill px-3 border text-secondary">Giá thấp</button>
                                <button className="btn btn-light btn-sm rounded-pill px-3 border text-secondary">Giá cao</button>
                            </div>
                        </div>

                        {/* Lưới hiển thị các sản phẩm (4 Cột chuẩn Responsive Bootstrap) */}
                        <div className="row g-3 row-cols-2 row-cols-sm-3 row-cols-md-4">
                            {products.map((product) => {
                                // Sử dụng một Component nội bộ hoặc Hook nhỏ để quản lý variant được chọn cho từng sản phẩm
                                return <ProductCard key={product.id || product._id} product={product} />;
                            })}
                        </div>

                        {/* Nếu rỗng không có sản phẩm */}
                        {!productLoading && products.length === 0 && (
                            <div className="text-center py-5 bg-white rounded-3 shadow-sm mt-2 text-secondary">
                                Chưa có sản phẩm nào trong danh mục này.
                            </div>
                        )}

                        {/* NÚT XEM THÊM PHÂN TRANG */}
                        {hasMore && (
                            <div className="text-center mt-4 mb-5">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={productLoading}
                                    className="btn btn-outline-primary px-5 py-2 rounded-pill bg-white shadow-sm fw-semibold"
                                    style={{ minWidth: '200px' }}
                                >
                                    {productLoading ? (
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    ) : null}
                                    Xem thêm sản phẩm
                                </button>
                            </div>
                        )}

                        {/* Loading nhỏ khi bấm Xem Thêm nhưng chưa tải xong */}
                        {productLoading && products.length > 0 && (
                            <div className="text-center my-3 text-secondary" style={{ fontSize: '14px' }}>
                                Đang tải thêm sản phẩm...
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}
function ProductCard({ product }) {
    // 1. Tìm variant mặc định khi mới vào (variantDefault: true), nếu không có thì lấy cái đầu tiên
    const defaultVariant = product?.variants?.find(v => v.variantDefault) || product?.variants?.[0];

    // 2. Tạo state để lưu trữ variant đang được người dùng chọn kích hoạt
    const [selectedVariant, setSelectedVariant] = useState(defaultVariant);
    const navigate = useNavigate();

    // Đồng bộ lại variant nếu danh sách sản phẩm thay đổi (khi chuyển danh mục)
    useEffect(() => {
        if (defaultVariant) {
            setSelectedVariant(defaultVariant);
        }
    }, [defaultVariant]);
    console.log('selectedVariant ', selectedVariant);

    return (
        <div className="col">
            <div className="card h-100 border-0 shadow-sm rounded-3 p-0 text-start position-relative d-flex flex-column justify-between overflow-hidden">
                {/* ── ẢNH SẢN PHẨM (Lấp đầy phần trên) ── */}
                <div className="position-relative w-100" style={{ paddingBottom: '100%', cursor: 'pointer' }}
                    onClick={() => navigate(`/products/detail/${product.slug}`)}
                > {/* Duy trì tỷ lệ khung hình 1:1 cho vùng ảnh */}
                    <img
                        src={product?.primaryImageUrl || "https://nhathuoclongchau.com.vn/estore-images/category/duoc-my-pham/cham-soc-da-mat.png"}
                        alt={product?.name}
                        className="position-absolute top-0 start-0 w-100 h-100"
                        style={{ objectFit: 'cover' }} // Lấp đầy vùng ảnh, có thể cắt bớt nếu tỷ lệ ảnh không khớp
                    />

                    {/* Nhãn quốc gia / Xuất xứ góc trên (di chuyển vào trong vùng ảnh) */}
                    {product.country && (
                        <span className="position-absolute badge bg-body-secondary text-dark border rounded-1 px-2 py-1" style={{ top: '8px', left: '8px', fontSize: '10px', zIndex: 2 }}>
                            🌐 {product.country}
                        </span>
                    )}
                </div>

                {/* ── PHẦN THÔNG TIN (Sử dụng p-3 để tạo khoảng cách) ── */}
                <div className="p-3 d-flex flex-column flex-grow-1">
                    {/* Thông tin tên & Quy cách của Variant đang chọn */}
                    <div className="flex-grow-1 px-1">
                        <h6 className="fw-bold text-dark text-line-clamp-2 mb-1" style={{ fontSize: '14px', minHeight: '42px', lineHeight: '21px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {product?.name}
                        </h6>
                        <p className="text-secondary mb-2 fw-medium text-truncate" style={{ fontSize: '12px' }}>
                            Quy cách: {selectedVariant ? selectedVariant.variantName : 'Chưa có quy cách'}
                        </p>
                    </div>

                    {/* ── BỘ CHỌN VARIANT (Hiển thị tất cả quy cách dưới dạng nút bấm) ── */}
                    {product?.variants && product.variants.length > 0 && (
                        <div className="px-1 mb-2 d-flex flex-wrap gap-1 align-items-center" style={{ minHeight: '30px' }}>
                            {product.variants.map((v) => {
                                const isSelected = selectedVariant?.id === v.id;
                                return (
                                    <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => setSelectedVariant(v)}
                                        className={`btn btn-sm py-1 px-2 rounded-2 border text-truncate fw-medium ${isSelected
                                            ? 'btn-primary border-primary text-white shadow-sm'
                                            : 'btn-light border-light-subtle text-secondary'
                                            }`}
                                        style={{ fontSize: '11px', maxWidth: '100%' }}
                                    >
                                        {v.variantName} {/* Rút ngắn chữ "Hộp" nếu muốn giao diện gọn gàng hơn */}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Giá bán theo Variant đang chọn và nút Chọn mua */}
                    <div className="px-1 mt-auto pt-2">
                        <div className="fw-bold text-primary mb-2 d-flex align-items-baseline gap-1" style={{ fontSize: '16px' }}>
                            {selectedVariant ? (
                                <>
                                    <span>{selectedVariant.price?.toLocaleString('vi-VN')}đ</span>
                                    {selectedVariant.originalPrice > selectedVariant.price && (
                                        <span className="text-decoration-line-through text-muted fw-normal ms-1" style={{ fontSize: '12px' }}>
                                            {selectedVariant.originalPrice?.toLocaleString('vi-VN')}đ
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-secondary fs-6 fw-normal">Liên hệ tư vấn</span>
                            )}
                        </div>

                        <button
                            className="btn btn-primary w-100 rounded-pill py-2 fw-semibold"
                            style={{ fontSize: '14px' }}

                            disabled={selectedVariant?.stockQuantity === 0}
                            onClick={() => {
                                if (product?.prescription) {
                                    // Logic khi bấm vào nút "Tư vấn" (Ví dụ: Mở hotline, mở chat, hoặc hiện popup nhập SĐT)
                                    alert("Mở cổng tư vấn cho sản phẩm: " + product.name);
                                } else {
                                    // Logic khi bấm vào nút "Chọn mua" bình thường
                                    alert("Thêm vào giỏ hàng variant: " + selectedVariant?.variantName);
                                }
                            }}
                        >
                            {product?.prescription ? 'Tư vấn' : (
                                selectedVariant?.stockQuantity === 0 ? 'Hết hàng' : 'Chọn mua'
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}