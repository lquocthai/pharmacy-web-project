import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'; // Thêm useSearchParams
import { FaChevronDown, FaChevronLeft, FaChevronRight, FaChevronUp } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import toast from 'react-hot-toast';
import categoryService from '../../services/categoryService';
import productService from '../../services/productService';
import elasticSearchService from '../../services/elasticSearchService'; // Import ElasticSearch Service
import { useDispatch, useSelector } from 'react-redux';
import cartService from '../../services/cartService';
import { setCart } from '../../redux/slices/cartSlice';
import { openLoginModal } from '../../redux/slices/authSlice';
import { Nav } from 'react-bootstrap';
import '../Product/ProductPage.scss'
import SearchNotFoundIcon from '../../assets/illustration-not-found.svg';
import AllProduct from '../../assets/all.png';


export default function ProductPage() {
    const { slug } = useParams();
    const [searchParams] = useSearchParams(); // Hook lấy query param từ URL (?search=...)
    const searchQuery = searchParams.get('search'); // Lấy chuỗi từ khóa tìm kiếm
    const isCategoryMode = !!slug && !searchQuery;

    // State của danh mục
    const [categoryTree, setCategoryTree] = useState(null);
    const [categoryLoading, setCategoryLoading] = useState(true);
    const [selectedSub, setSelectedSub] = useState('all');

    // State của sản phẩm phân trang
    const [products, setProducts] = useState([]);
    const [productLoading, setProductLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    const scrollRef = useRef(null);
    const [selectedPrice, setSelectedPrice] = useState('all');
    const [selectedManufacturer, setSelectedManufacturer] = useState('all');
    const [selectedCountry, setSelectedCountry] = useState('all');
    const [sortConfig, setSortConfig] = useState({ sortBy: 'name', sortDir: 'asc' });
    const [isManufacturerOpen, setIsManufacturerOpen] = useState(false);
    const [isCountryOpen, setIsCountryOpen] = useState(false);

    const priceOptions = [
        { label: 'Tất cả mức giá', value: 'all', minPrice: null, maxPrice: null },
        { label: 'Dưới 100.000đ', value: 'under-100', minPrice: null, maxPrice: 100000 },
        { label: '100.000đ đến 300.000đ', value: '100-300', minPrice: 100000, maxPrice: 300000 },
        { label: '300.000đ đến 500.000đ', value: '300-500', minPrice: 300000, maxPrice: 500000 },
        { label: 'Trên 500.000đ', value: 'over-500', minPrice: 500000, maxPrice: null }
    ];

    const manufacturerOptions = [
        { label: 'Tất cả nhà sản xuất', value: 'all' },
        { label: 'FUJI', value: 'FUJI' },
        { label: 'LAVOX', value: 'LAVOX' },
        { label: 'sachi', value: 'sachi' },
        { label: 'La Beauty', value: 'La Beauty' },
        { label: 'MEDICLEEN', value: 'MEDICLEEN' },
        { label: 'Cerave', value: 'Cerave' }
    ];

    const countryOptions = [
        { label: 'Tất cả quốc gia', value: 'all' },
        { label: 'Việt Nam', value: 'Việt Nam' },
        { label: 'Pháp', value: 'Pháp' },
        { label: 'Đức', value: 'Đức' },
        { label: 'Hoa Kỳ', value: 'Hoa Kỳ' },
        { label: 'Nhật Bản', value: 'Nhật Bản' },
        { label: 'Hàn Quốc', value: 'Hàn Quốc' },
        { label: 'Trung Quốc', value: 'Trung Quốc' }
    ];

    const getPriceRange = (priceValue = selectedPrice) => {
        const option = priceOptions.find(item => item.value === priceValue);
        return {
            minPrice: option?.minPrice ?? null,
            maxPrice: option?.maxPrice ?? null
        };
    };

    const getProductQuery = (overrides = {}) => {
        const nextPrice = overrides.selectedPrice ?? selectedPrice;
        const nextManufacturer = overrides.selectedManufacturer ?? selectedManufacturer;
        const nextCountry = overrides.selectedCountry ?? selectedCountry;
        const nextSortConfig = overrides.sortConfig ?? sortConfig;
        const { minPrice, maxPrice } = getPriceRange(nextPrice);

        return {
            sortBy: nextSortConfig.sortBy,
            sortDir: nextSortConfig.sortDir,
            manufacturer: nextManufacturer === 'all' ? null : nextManufacturer,
            country: nextCountry === 'all' ? null : nextCountry,
            minPrice,
            maxPrice
        };
    };

    // 1. Tải cây danh mục
    const loadCategoryTree = async (mainSlug) => {
        // NẾU LÀ SEARCH: Bỏ qua hoàn toàn việc gọi API load cây danh mục
        if (searchQuery) {
            setCategoryTree([]);
            setCategoryLoading(false);
            return;
        }

        if (!mainSlug) return;

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

    // 2. Tải danh sách sản phẩm (Hỗ trợ phân rẽ sang ElasticSearch khi có searchQuery)
    const loadProducts = async (targetSlug, currentPage, isLoadMore = false, queryOverrides = {}) => {
        setProductLoading(true);
        try {
            let responseData;

            if (searchQuery) {
                // TRƯỜNG HỢP 1: TÌM KIẾM SẢN PHẨM (Sử dụng ElasticSearch)
                // Phía ElasticSearch nhận size cố định là 8 mục tương tự API cũ của bạn
                const { data } = await elasticSearchService.searchProducts(searchQuery, currentPage, 8);
                responseData = data;
            } else {
                // TRƯỜNG HỢP 2: DUYỆT THEO DANH MỤC (API Cũ)
                const productQuery = getProductQuery(queryOverrides);
                const { data } = await productService.getByCategory(
                    targetSlug,
                    currentPage,
                    8,
                    productQuery.sortBy,
                    productQuery.sortDir,
                    productQuery.manufacturer,
                    productQuery.country,
                    productQuery.minPrice,
                    productQuery.maxPrice
                );
                responseData = data;
            }

            // Đồng bộ định dạng phản hồi dữ liệu (Xử lý cấu trúc giống hệt nhau)
            const pageData = responseData.result || {};
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

    // Theo dõi khi đổi URL (Bao gồm chuyển đổi giữa các Slug danh mục hoặc thay đổi Từ khóa tìm kiếm)
    useEffect(() => {
        loadCategoryTree(slug);
        setSelectedSub('all');
        setPage(0);
        loadProducts(slug, 0, false);
    }, [slug, searchQuery]); // Bổ sung lắng nghe sự thay đổi của searchQuery


    const handleClearAllFilters = () => {
        setSelectedPrice('all');
        setSelectedManufacturer('all');
        setSelectedCountry('all');
        setSortConfig({ sortBy: 'name', sortDir: 'asc' });
        setPage(0);

        const activeSlug = selectedSub === 'all' ? slug : selectedSub;

        loadProducts(activeSlug, 0, false, {
            selectedPrice: 'all',
            selectedManufacturer: 'all',
            selectedCountry: 'all',
            sortConfig: { sortBy: 'name', sortDir: 'asc' }
        });
    };

    const handleSubCategoryClick = (subSlug) => {
        setSelectedSub(subSlug);
        setPage(0);

        const activeSlug = subSlug === 'all' ? slug : subSlug;
        loadProducts(activeSlug, 0, false);
    };

    const reloadProductsWithFilters = (overrides = {}) => {
        setPage(0);
        const activeSlug = selectedSub === 'all' ? slug : selectedSub;
        loadProducts(activeSlug, 0, false, overrides);
    };

    const handlePriceClick = (priceValue) => {
        setSelectedPrice(priceValue);
        reloadProductsWithFilters({ selectedPrice: priceValue });
    };

    const handleManufacturerClick = (manufacturerValue) => {
        setSelectedManufacturer(manufacturerValue);
        reloadProductsWithFilters({ selectedManufacturer: manufacturerValue });
    };

    const handleCountryClick = (countryValue) => {
        setSelectedCountry(countryValue);
        reloadProductsWithFilters({ selectedCountry: countryValue });
    };

    const handleSortClick = (sortDir) => {
        const nextSortConfig = { sortBy: 'priceDefault', sortDir };
        setSortConfig(nextSortConfig);
        reloadProductsWithFilters({ sortConfig: nextSortConfig });
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        const activeSlug = selectedSub === 'all' ? slug : selectedSub;
        loadProducts(activeSlug, nextPage, true);
    };

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

    if (categoryLoading) {
        return <div className="container text-center py-5">Đang tải danh mục...</div>;
    }

    return (
        <main style={{ minHeight: '60vh' }}>
            <div className="container min-vh-100 py-1 ">
                {/* ── BREADCRUMB (Đường dẫn) ── */}
                <Nav className="small mb-4 text-muted">
                    Trang chủ / <span className="text-primary ms-1 fw-bold">{categoryTree?.name || 'Danh mục'}</span>
                </Nav>

                {/* ── TIÊU ĐỀ DANH MỤC CHA ── */}
                <h1 className=" mb-4 text-dark text-start" style={{ fontSize: '28px' }}>
                    {categoryTree?.name}
                </h1>

                {/* ── GRID/SLIDER DANH MỤC CON (CẤP 2) ── */}
                {isCategoryMode ?
                    (<div className="position-relative mb-4 px-2 d-flex align-items-center">
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
                                style={{ width: '200px', scrollSnapAlign: 'start', transition: 'all 0.2s', cursor: 'pointer' }}
                                onClick={() => handleSubCategoryClick('all')}
                            >
                                <div className="mb-2 d-flex align-items-center justify-content-center mx-auto" style={{ width: '56px', height: '56px' }}>
                                    <img
                                        src={AllProduct}
                                        alt="Tất cả"
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                    />
                                </div>
                                <span style={{ fontSize: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '42px', lineHeight: '21px' }}>Tất cả sản phẩm</span>
                            </div>

                            {/* Duyệt mảng con `children` từ API */}
                            {categoryTree?.children && categoryTree.children.map((child) => (
                                <div
                                    key={child.id || child._id}
                                    className={`card flex-shrink-0 text-center border-0 p-3 shadow-sm rounded-3 ${selectedSub === child.slug ? 'border border-2 border-primary fw-bold text-primary' : ''}`}
                                    style={{ width: '200px', scrollSnapAlign: 'start', transition: 'all 0.2s', cursor: 'pointer' }}
                                    onClick={() => handleSubCategoryClick(child.slug)}
                                >
                                    <div className="mb-2 d-flex align-items-center justify-content-center mx-auto" style={{ width: '56px', height: '56px' }}>
                                        <img
                                            src={child.icon || AllProduct}
                                            alt={child.name}
                                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                        />
                                    </div>
                                    <span style={{ fontSize: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '42px', lineHeight: '21px' }}>
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
                    </div>) :
                    (<div className='text-start mb-2'>Đang hiển thị kết quả tìm kiếm</div>)}

                <div className="container-xl ">


                    {/* ── BỐ CỤC CHÍNH: BỘ LỌC BÊN TRÁI & DANH SÁCH SẢN PHẨM BÊN PHẢI ── */}
                    <div className="row">

                        {/* BỘ LỌC NÂNG CAO (Bên trái - Chiếm 3/12 cột ở màn hình lớn) */}
                        <div className="col-10 col-md-3 mb-4 text-start ">
                            <div className="bg-white p-3 rounded-3 shadow-sm border-0 sticky-top">
                                <h5 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: '16px' }}>
                                    <span className="me-2">☰</span> Bộ lọc nâng cao
                                </h5>
                                <hr className="text-muted my-2" />
                                {/* Giá bán */}
                                <div className="mb-2 border-bottom pb-3">
                                    <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '14px' }}>Giá bán</h6>
                                    <div className="d-flex flex-column gap-2">
                                        {priceOptions.map((option) => {
                                            const isActive = selectedPrice === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => handlePriceClick(option.value)}
                                                    className={`btn w-100 text-start py-2 px-3 custom-price-btn ${isActive ? 'active' : ''}`}
                                                    style={{ fontSize: '13px' }}
                                                >
                                                    {option.label}

                                                    {/* Dấu tích góc trên bên phải khi được chọn */}
                                                    {isActive && (
                                                        <span className="active-checkmark-badge">
                                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                            </svg>
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Nhà sản xuất */}
                                <div className="mb-2 border-bottom pb-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsManufacturerOpen(prev => !prev)}
                                        className="btn w-100 p-0 border-0 bg-transparent d-flex align-items-center justify-content-between text-dark fw-bold mb-2"
                                        style={{ fontSize: '14px', boxShadow: 'none' }}
                                        aria-expanded={isManufacturerOpen}
                                    >
                                        <span>Nhà sản xuất</span>
                                        {isManufacturerOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                    </button>
                                    <div
                                        className="d-flex flex-column gap-2"
                                        style={{
                                            maxHeight: isManufacturerOpen ? '360px' : '0',
                                            opacity: isManufacturerOpen ? 1 : 0,
                                            overflow: 'hidden',
                                            transition: 'max-height 0.28s ease, opacity 0.2s ease'
                                        }}
                                    >
                                        {manufacturerOptions.map((option) => {
                                            const isActive = selectedManufacturer === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => handleManufacturerClick(option.value)}
                                                    className={`btn w-100 text-start py-2 px-3 custom-price-btn ${isActive ? 'active' : ''}`}
                                                    style={{ fontSize: '13px' }}
                                                >
                                                    {option.label}
                                                    {isActive && (
                                                        <span className="active-checkmark-badge">
                                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                            </svg>
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Quốc gia */}
                                <div className="mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCountryOpen(prev => !prev)}
                                        className="btn w-100 p-0 border-0 bg-transparent d-flex align-items-center justify-content-between text-dark fw-bold mb-2"
                                        style={{ fontSize: '14px', boxShadow: 'none' }}
                                        aria-expanded={isCountryOpen}
                                    >
                                        <span>Quốc gia</span>
                                        {isCountryOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                    </button>
                                    <div
                                        className="d-flex flex-column gap-2"
                                        style={{
                                            maxHeight: isCountryOpen ? '360px' : '0',
                                            opacity: isCountryOpen ? 1 : 0,
                                            overflow: 'hidden',
                                            transition: 'max-height 0.28s ease, opacity 0.2s ease'
                                        }}
                                    >
                                        {countryOptions.map((option) => {
                                            const isActive = selectedCountry === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => handleCountryClick(option.value)}
                                                    className={`btn w-100 text-start py-2 px-3 custom-price-btn ${isActive ? 'active' : ''}`}
                                                    style={{ fontSize: '13px' }}
                                                >
                                                    {option.label}
                                                    {isActive && (
                                                        <span className="active-checkmark-badge">
                                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                            </svg>
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
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

                                    <button
                                        type="button"
                                        onClick={() => handleSortClick('asc')}
                                        className={`btn btn-sm rounded-pill px-3 border ${sortConfig.sortBy === 'priceDefault' && sortConfig.sortDir === 'asc' ? 'btn-primary text-white' : 'btn-light text-secondary'}`}
                                    >
                                        Giá thấp
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSortClick('desc')}
                                        className={`btn btn-sm rounded-pill px-3 border ${sortConfig.sortBy === 'priceDefault' && sortConfig.sortDir === 'desc' ? 'btn-primary text-white' : 'btn-light text-secondary'}`}
                                    >
                                        Giá cao
                                    </button>
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
                            {/* Nếu rỗng không có sản phẩm thỏa mãn bộ lọc */}
                            {!productLoading && products.length === 0 && (
                                <div className="text-center py-5  mt-2 px-3 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '400px' }}>

                                    {/* 1. Hình ảnh minh họa / Kính lúp (Sử dụng CSS để tạo hình khối mượt hoặc ảnh từ URL) */}
                                    <div className="position-relative mb-4 d-flex align-items-center justify-content-center" style={{ width: '150px', height: '120px' }}>
                                        {/* Vòng tròn đổ bóng phía dưới kính lúp */}
                                        <div className="position-absolute bottom-0 start-50 translate-middle-x rounded-circle"
                                            style={{ width: '100px', height: '16px', background: 'rgba(0,0,0,0.04)', filter: 'blur(4px)' }}>
                                        </div>
                                        {/* Bạn có thể thay src bằng một icon SVG hoặc ảnh kính lúp 3D tùy ý */}
                                        <img
                                            src={SearchNotFoundIcon}
                                            alt="Không tìm thấy kết quả"
                                            // style={{ width: '100px', objectFit: 'contain', animation: 'float 3s ease-in-out infinite' }}
                                            className="position-relative"
                                        />
                                    </div>

                                    {/* 2. Tiêu đề thông báo */}
                                    <h4 className="fw-bold text-dark mb-2" style={{ fontSize: '18px', color: '#334155' }}>
                                        Không tìm thấy sản phẩm nào phù hợp!
                                    </h4>

                                    {/* 3. Dòng mô tả hướng dẫn */}
                                    <p className="text-muted mb-4 small text-center mx-auto" style={{ maxWidth: '340px', color: '#64748b', lineHeight: '1.5' }}>
                                        Hãy thử lại bằng cách thay đổi điều kiện lọc <br /> hoặc
                                    </p>

                                    {/* 4. Nút Xóa tất cả bộ lọc */}
                                    <button
                                        type="button"
                                        onClick={() => handleClearAllFilters()}
                                        className="btn btn-primary px-4 py-2 rounded-pill fw-semibold border-0 shadow-sm"
                                        style={{
                                            backgroundColor: '#1d55e3',
                                            fontSize: '14px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => e.target.style.backgroundColor = '#1744b8'}
                                        onMouseOut={(e) => e.target.style.backgroundColor = '#1d55e3'}
                                    >
                                        Xóa tất cả bộ lọc
                                    </button>
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
        </main>
    );
}
export function ProductCard({ product }) {
    console.log("123", product)
    const { isAuthenticated } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    // 1. Tìm variant mặc định khi mới vào (variantDefault: true), nếu không có thì lấy cái đầu tiên
    const defaultVariant = product?.variants?.find(v => v.variantDefault) || product?.variants?.[0];

    // 2. Tạo state để lưu trữ variant đang được người dùng chọn kích hoạt
    const [selectedVariant, setSelectedVariant] = useState(defaultVariant);
    const navigate = useNavigate();
    const [addingToCart, setAddingToCart] = useState(false); // Thêm state loading để chặn bấm liên tục

    // Đồng bộ lại variant nếu danh sách sản phẩm thay đổi (khi chuyển danh mục)
    useEffect(() => {
        if (defaultVariant) {
            setSelectedVariant(defaultVariant);
        }
    }, [defaultVariant]);
    // xử lí chọn mua
    // Xử lý chọn mua (Mỗi lần bấm thêm đúng 1 sản phẩm)
    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            dispatch(openLoginModal());
            return;
        }

        if (!selectedVariant) {
            toast.error('Sản phẩm hiện chưa có quy cách hợp lệ.');
            return;
        }

        // Validate kho: Vì mỗi lần bấm chỉ mua 1 sản phẩm, ta kiểm tra nếu kho < 1 thì báo hết hàng
        if (selectedVariant.stockQuantity < 1) {
            toast.error(`Sản phẩm quy cách ${selectedVariant.variantName} đã hết hàng khả dụng.`);
            return;
        }

        setAddingToCart(true);
        try {
            // Truyền cứng số lượng là 1 và id của biến selectedVariant đang chọn
            const { data } = await cartService.addItem({
                variantId: selectedVariant.id,
                quantity: 1
            });
            if (data.code === 0) {
                dispatch(setCart(data.result));
                toast.success(`Đã thêm 1 ${selectedVariant?.variantName || ''} vào giỏ hàng thành công`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể thêm vào giỏ hàng');
        } finally {
            setAddingToCart(false);
        }
    };
    const countryFlagMap = {
        // === ĐÔNG NAM Á ===
        'Việt Nam': 'vn', 'việt nam': 'vn', 'Vietnam': 'vn', 'vietnam': 'vn', 'VN': 'vn', 'vn': 'vn',
        'Thái Lan': 'th', 'thái lan': 'th', 'Thailand': 'th', 'thailand': 'th', 'TH': 'th', 'th': 'th',
        'Singapore': 'sg', 'singapore': 'sg', 'SG': 'sg', 'sg': 'sg',
        'Malaysia': 'my', 'malaysia': 'my', 'MY': 'my', 'my': 'my',
        'Indonesia': 'id', 'indonesia': 'id', 'ID': 'id', 'id': 'id',
        'Philippines': 'ph', 'philippines': 'ph', 'PH': 'ph', 'ph': 'ph',
        'Lào': 'la', 'lào': 'la', 'Laos': 'la', 'laos': 'la', 'LA': 'la', 'la': 'la',
        'Campuchia': 'kh', 'campuchia': 'kh', 'Cambodia': 'kh', 'cambodia': 'kh', 'KH': 'kh', 'kh': 'kh',
        'Myanmar': 'mm', 'myanmar': 'mm', 'Miến Điện': 'mm', 'miến điện': 'mm', 'MM': 'mm', 'mm': 'mm',
        'Brunei': 'bn', 'brunei': 'bn', 'BN': 'bn', 'bn': 'bn',
        'Đông Timor': 'tl', 'đông timor': 'tl', 'East Timor': 'tl', 'east timor': 'tl', 'TL': 'tl', 'tl': 'tl',

        // === ĐÔNG Á & NAM Á ===
        'Nhật Bản': 'jp', 'nhật bản': 'jp', 'Japan': 'jp', 'japan': 'jp', 'JP': 'jp', 'jp': 'jp',
        'Hàn Quốc': 'kr', 'hàn quốc': 'kr', 'South Korea': 'kr', 'south korea': 'kr', 'Korea': 'kr', 'korea': 'kr', 'KR': 'kr', 'kr': 'kr',
        'Trung Quốc': 'cn', 'trung quốc': 'cn', 'China': 'cn', 'china': 'cn', 'CN': 'cn', 'cn': 'cn',
        'Đài Loan': 'tw', 'đài loan': 'tw', 'Taiwan': 'tw', 'taiwan': 'tw', 'TW': 'tw', 'tw': 'tw',
        'Hồng Kông': 'hk', 'hồng kông': 'hk', 'Hong Kong': 'hk', 'hong kong': 'hk', 'HK': 'hk', 'hk': 'hk',
        'Ấn Độ': 'in', 'ấn độ': 'in', 'India': 'in', 'india': 'in', 'IN': 'in', 'in': 'in',
        'Pakistan': 'pk', 'pakistan': 'pk', 'PK': 'pk', 'pk': 'pk',
        'Bangladesh': 'bd', 'bangladesh': 'bd', 'BD': 'bd', 'bd': 'bd',
        'Sri Lanka': 'lk', 'sri lanka': 'lk', 'LK': 'lk', 'lk': 'lk',
        'Nepal': 'np', 'nepal': 'np', 'NP': 'np', 'np': 'np',
        'Maldives': 'mv', 'maldives': 'mv', 'MV': 'mv', 'mv': 'mv',

        // === CHÂU MỸ ===
        'Hoa Kỳ': 'us', 'hoa kỳ': 'us', 'Mỹ': 'us', 'mỹ': 'us', 'USA': 'us', 'usa': 'us', 'United States': 'us', 'united states': 'us', 'US': 'us', 'us': 'us',
        'Canada': 'ca', 'canada': 'ca', 'CA': 'ca', 'ca': 'ca',
        'Mexico': 'mx', 'mexico': 'mx', 'México': 'mx', 'méxico': 'mx', 'MX': 'mx', 'mx': 'mx',
        'Brazil': 'br', 'brazil': 'br', 'BR': 'br', 'br': 'br',
        'Argentina': 'ar', 'argentina': 'ar', 'AR': 'ar', 'ar': 'ar',
        'Chile': 'cl', 'chile': 'cl', 'CL': 'cl', 'cl': 'cl',
        'Colombia': 'co', 'colombia': 'co', 'CO': 'co', 'co': 'co',
        'Peru': 'pe', 'peru': 'pe', 'PE': 'pe', 'pe': 'pe',
        'Cuba': 'cu', 'cuba': 'cu', 'CU': 'cu', 'cu': 'cu',
        'Ecuador': 'ec', 'ecuador': 'ec', 'EC': 'ec', 'ec': 'ec',
        'Uruguay': 'uy', 'uruguay': 'uy', 'UY': 'uy', 'uy': 'uy',
        'Venezuela': 've', 'venezuela': 've', 'VE': 've', 've': 've',

        // === CHÂU ÂU ===
        'Anh': 'gb', 'anh': 'gb', 'Anh Quốc': 'gb', 'anh quốc': 'gb', 'United Kingdom': 'gb', 'united kingdom': 'gb', 'UK': 'gb', 'uk': 'gb', 'GB': 'gb', 'gb': 'gb',
        'Pháp': 'fr', 'pháp': 'fr', 'France': 'fr', 'france': 'fr', 'FR': 'fr', 'fr': 'fr',
        'Đức': 'de', 'đức': 'de', 'Germany': 'de', 'germany': 'de', 'DE': 'de', 'de': 'de',
        'Ý': 'it', 'ý': 'it', 'Italia': 'it', 'italia': 'it', 'Italy': 'it', 'italy': 'it', 'IT': 'it', 'it': 'it',
        'Tây Ban Nha': 'es', 'tây ban nha': 'es', 'Spain': 'es', 'spain': 'es', 'ES': 'es', 'es': 'es',
        'Bồ Đào Nha': 'pt', 'bồ đào nha': 'pt', 'Portugal': 'pt', 'portugal': 'pt', 'PT': 'pt', 'pt': 'pt',
        'Nga': 'ru', 'nga': 'ru', 'Russia': 'ru', 'russia': 'ru', 'Liên Bang Nga': 'ru', 'liên bang nga': 'ru', 'RU': 'ru', 'ru': 'ru',
        'Thụy Sĩ': 'ch', 'thụy sĩ': 'ch', 'Switzerland': 'ch', 'switzerland': 'ch', 'CH': 'ch', 'ch': 'ch',
        'Thụy Điển': 'se', 'thụy điển': 'se', 'Sweden': 'se', 'sweden': 'se', 'SE': 'se', 'se': 'se',
        'Na Uy': 'no', 'na uy': 'no', 'Norway': 'no', 'norway': 'no', 'NO': 'no', 'no': 'no',
        'Đan Mạch': 'dk', 'đan mạch': 'dk', 'Denmark': 'dk', 'denmark': 'dk', 'DK': 'dk', 'dk': 'dk',
        'Phần Lan': 'fi', 'phần lằn': 'fi', 'Finland': 'fi', 'finland': 'fi', 'FI': 'fi', 'fi': 'fi',
        'Hà Lan': 'nl', 'hà lan': 'nl', 'Netherlands': 'nl', 'netherlands': 'nl', 'NL': 'nl', 'nl': 'nl',
        'Bỉ': 'be', 'bỉ': 'be', 'Belgium': 'be', 'belgium': 'be', 'BE': 'be', 'be': 'be',
        'Áo': 'at', 'áo': 'at', 'Austria': 'at', 'austria': 'at', 'AT': 'at', 'at': 'at',
        'Hy Lạp': 'gr', 'hy lạp': 'gr', 'Greece': 'gr', 'greece': 'gr', 'GR': 'gr', 'gr': 'gr',
        'Ba Lan': 'pl', 'ba lan': 'pl', 'Poland': 'pl', 'poland': 'pl', 'PL': 'pl', 'pl': 'pl',
        'Thổ Nhĩ Kỳ': 'tr', 'thổ nhĩ kỳ': 'tr', 'Turkey': 'tr', 'turkey': 'tr', 'TR': 'tr', 'tr': 'tr',
        'Ukraine': 'ua', 'ukraine': 'ua', 'Ukraina': 'ua', 'ukraina': 'ua', 'UA': 'ua', 'ua': 'ua',
        'Cộng hòa Séc': 'cz', 'cộng hòa séc': 'cz', 'Czech Republic': 'cz', 'czech republic': 'cz', 'CZ': 'cz', 'cz': 'cz',
        'Hungary': 'hu', 'hungary': 'hu', 'HU': 'hu', 'hu': 'hu',
        'Ireland': 'ie', 'ireland': 'ie', 'IE': 'ie', 'ie': 'ie',
        'Iceland': 'is', 'iceland': 'is', 'IS': 'is', 'is': 'is',
        'Romania': 'ro', 'romania': 'ro', 'RO': 'ro', 'ro': 'ro',
        'Slovakia': 'sk', 'slovakia': 'sk', 'SK': 'sk', 'sk': 'sk',

        // === CHÂU ÚC ===
        'Úc': 'au', 'úc': 'au', 'Australia': 'au', 'australia': 'au', 'AU': 'au', 'au': 'au',
        'New Zealand': 'nz', 'new zealand': 'nz', 'NZ': 'nz', 'nz': 'nz',

        // === CHÂU PHI & TRUNG ĐÔNG ===
        'Nam Phi': 'za', 'nam phi': 'za', 'South Africa': 'za', 'south africa': 'za', 'ZA': 'za', 'za': 'za',
        'Ai Cập': 'eg', 'ai cập': 'eg', 'Egypt': 'eg', 'egypt': 'eg', 'EG': 'eg', 'eg': 'eg',
        'Ả Rập Xê Út': 'sa', 'ả rập xê út': 'sa', 'Saudi Arabia': 'sa', 'saudi arabia': 'sa', 'SA': 'sa', 'sa': 'sa',
        'UAE': 'ae', 'uae': 'ae', 'Các Tiểu vương quốc Ả Rập Thống nhất': 'ae', 'các tiểu vương quốc ả rập thống nhất': 'ae', 'AE': 'ae', 'ae': 'ae',
        'Israel': 'il', 'israel': 'il', 'IL': 'il', 'il': 'il',
        'Iran': 'ir', 'iran': 'ir', 'IR': 'ir', 'ir': 'ir',
        'Iraq': 'iq', 'iraq': 'iq', 'IQ': 'iq', 'iq': 'iq',
        'Maroc': 'ma', 'maroc': 'ma', 'Morocco': 'ma', 'morocco': 'ma', 'MA': 'ma', 'ma': 'ma',
        'Nigeria': 'ng', 'nigeria': 'ng', 'NG': 'ng', 'ng': 'ng',
        'Kenya': 'ke', 'kenya': 'ke', 'KE': 'ke', 'ke': 'ke',
        'Algeria': 'dz', 'algeria': 'dz', 'DZ': 'dz', 'dz': 'dz',
    };

    // Hàm lấy URL cờ giữ nguyên như cũ, chạy cực kỳ an toàn
    const getCountryFlagUrl = (country) => {
        if (!country) return 'https://flagcdn.com/w40/un.png';

        const cleanInput = country.trim().toLowerCase();
        const code = countryFlagMap[cleanInput] || countryFlagMap[country.trim()];

        if (!code) {
            if (cleanInput.length === 2) {
                return `https://flagcdn.com/w40/${cleanInput}.png`;
            }
            return 'https://flagcdn.com/w40/un.png';
        }

        return `https://flagcdn.com/w40/${code}.png`;
    };


    return (
        <div className="col">
            <div className=" product-card-hover card h-100 border-0 shadow-sm rounded-3 p-0 text-start position-relative d-flex flex-column justify-between overflow-hidden">
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
                        <span
                            className="position-absolute bg-white border rounded-pill px-2 py-1 shadow-sm d-flex align-items-center gap-1"
                            style={{
                                top: '8px',
                                left: '8px',
                                fontSize: '11px',
                                zIndex: 2,
                                fontWeight: 500
                            }}
                        >
                            <img
                                src={getCountryFlagUrl(product.country)}
                                alt={product.country}
                                style={{
                                    width: '16px',
                                    height: '12px',
                                    objectFit: 'cover',
                                    borderRadius: '2px'
                                }}
                            />

                            <span>{product.country}</span>
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
                                    navigate(`/products/detail/${product.slug}`)
                                } else {
                                    // Logic khi bấm vào nút "Chọn mua" bình thường
                                    handleAddToCart();
                                }
                            }}
                        >
                            {product?.prescription ? 'Xem chi tiết' : (
                                selectedVariant?.stockQuantity === 0 ? 'Hết hàng' : (addingToCart ? 'Đang thêm...' : 'Chọn mua')
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
