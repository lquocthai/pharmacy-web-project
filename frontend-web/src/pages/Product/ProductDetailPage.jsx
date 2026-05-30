import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { ShoppingCart, Star, ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import productService from '../../services/productService';
import ratingService from '../../services/ratingService';
import cartService from '../../services/cartService';
import { setCart } from '../../redux/slices/cartSlice';
import { openLoginModal } from '../../redux/slices/authSlice';
import RatingSummary from '../../components/Rating/RatingSummary';
import RatingList from '../../components/Rating/RatingList';
import RatingForm from '../../components/Rating/RatingForm';
import toast from 'react-hot-toast';
import '../../assets/styles/ProductDetailPage.scss';
import { openChat } from '../../redux/slices/chatSlice';

// ─── IMPORT SWIPER COMPONENTS VÀ STYLES ───
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const ProductDetailPage = () => {
    const thumbnailRefs = useRef([]);
    const { slug } = useParams();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector(state => state.auth);
    const isChatOpen = useSelector((state) => state.chat.isChatOpen);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Ảnh đang chọn trong gallery
    const [selectedImage, setSelectedImage] = useState(null);

    // Trạng thái đóng/mở và quản lý ảnh của Modal Phóng To
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalActiveIndex, setModalActiveIndex] = useState(0);

    // Số lượng thêm vào giỏ
    const [qty, setQty] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);

    // Rating state
    const [ratings, setRatings] = useState([]);
    const [ratingPage, setRatingPage] = useState(0);
    const [ratingTotal, setRatingTotal] = useState(0);
    const [ratingLast, setRatingLast] = useState(false);
    const [starFilter, setStarFilter] = useState(null); // null = tất cả
    const [ratingLoading, setRatingLoading] = useState(false);
    const [ratingSummary, setRatingSummary] = useState(null);

    const [selectedVariantId, setSelectedVariantId] = useState(null); // Mặc định chưa chọn variant nào
    useEffect(() => {
        const activeThumb = thumbnailRefs.current[modalActiveIndex];

        if (activeThumb) {
            activeThumb.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest'
            });
        }
    }, [modalActiveIndex]);
    // Load product detail
    useEffect(() => {
        console.log('Loading product detail for slug:', slug);
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data } = await productService.getDetail(slug);
                if (data.code !== 0) throw new Error(data.message);

                const loadedProduct = data.result;
                setProduct(data.result);
                setRatingSummary(data.result.ratingSummary);
                console.log('Product detail loaded:', data.result);

                // 1. TỰ ĐỘNG TÌM VARIANT MẶC ĐỊNH (variantDefault === true)
                const defaultVariant = loadedProduct.variants?.find(v => v.variantDefault)
                    || loadedProduct.variants?.[0]; // Fallback nếu không có cấu hình default
                if (defaultVariant) {
                    setSelectedVariantId(defaultVariant.id);
                }

                // Chọn ảnh primary mặc định
                const primary = data.result.images?.find(img => img.primary) || data.result.images?.[0];
                setSelectedImage(primary?.imageUrl || null);
            } catch (err) {
                setError(err.response?.data?.message || 'Không tìm thấy sản phẩm');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [slug]);

    console.log('Product state:', product);
    // ── LẤY RA OBJECT VARIANT HIỆN TẠI ĐỂ RENDER GIÁ/KHO RA JSX ──
    const currentVariant = product?.variants?.find(v => v.id === selectedVariantId);
    console.log('Current variant:', currentVariant);

    // Load ratings (reset khi đổi filter)
    useEffect(() => {
        if (!product) return;
        loadRatings(0, starFilter, true);
    }, [product?.id, starFilter]);

    const loadRatings = async (page, star, reset = false) => {
        setRatingLoading(true);
        try {
            const { data } = await ratingService.getByProduct(product.id, { star, page, size: 10 });
            if (data.code !== 0) return;
            const result = data.result;
            setRatings(prev => reset ? result.content : [...prev, ...result.content]);
            setRatingPage(result.page + 1);
            setRatingTotal(result.totalElements);
            setRatingLast(result.last);
        } finally {
            setRatingLoading(false);
        }
    };

    const handleLoadMore = () => loadRatings(ratingPage, starFilter);

    // xử lí khi đổi filter: reset page về 0, clear ratings cũ để load mới theo filter
    const handleFilterChange = (star) => {
        setStarFilter(star);
        setRatingPage(0);
        setRatings([]);
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            dispatch(openLoginModal());
            return;
        }
        if (!selectedVariantId) {
            toast.warning('Vui lòng chọn phân loại sản phẩm!');
            return;
        }
        if (currentVariant && qty > currentVariant.stockQuantity) {
            toast.error(`Sản phẩm này chỉ còn ${currentVariant.stockQuantity} sản phẩm khả dụng.`);
            return;
        }
        setAddingToCart(true);
        console.log('Thêm vào giỏ hàng variant: ', selectedVariantId, ' với số lượng: ', qty);
        try {
            const { data } = await cartService.addItem({ variantId: selectedVariantId, quantity: qty });
            if (data.code === 0) {
                dispatch(setCart(data.result));
                toast.success(`Thêm thành công ${qty} ${currentVariant?.variantName || ''} vào giỏ hàng`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể thêm vào giỏ hàng');
        } finally {
            setAddingToCart(false);
        }
    };

    const handleRatingSubmit = async ({ star, comment }) => {
        try {
            const { data } = await ratingService.create({ productId: product.id, star, comment });
            if (data.code !== 0) throw new Error(data.message);
            setRatings(prev => [data.result, ...prev]);
            setRatingTotal(prev => prev + 1);
            setRatingSummary(prev => {
                const newBreakdown = { ...prev.ratingBreakdown };
                newBreakdown[star] = (newBreakdown[star] || 0) + 1;
                const total = prev.totalRatings + 1;
                const sumStars = Object.entries(newBreakdown).reduce(
                    (acc, [s, c]) => acc + Number(s) * c, 0
                );
                return {
                    ...prev,
                    totalRatings: total,
                    averageRating: Math.round(sumStars / total * 10) / 10,
                    ratingBreakdown: newBreakdown,
                };
            });
            toast.success('Gửi đánh giá thành công');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể gửi đánh giá');
        }
    };

    const handleContactConsultant = () => {
        dispatch(openChat());
    };

    if (loading) return (
        <div className="d-flex justify-content-center py-5">
            <Spinner animation="border" variant="primary" />
        </div>
    );

    if (error) return (
        <Container className="py-5">
            <Alert variant="danger">{error}</Alert>
        </Container>
    );

    if (!product) return null;

    const discountPercent = currentVariant.originalPrice > currentVariant.price
        ? Math.round((1 - currentVariant.price / currentVariant.originalPrice) * 100)
        : 0;

    // Chuẩn bị mảng ảnh (nếu không có ảnh thì fallback)
    const productImages = product.images && product.images.length > 0
        ? product.images
        : [{ id: 'default', imageUrl: 'https://placehold.co/600x600?text=No+Image' }];

    return (
        <Container className="py-1 pt-4">
            {/* ── Thông tin sản phẩm ── */}
            <div className="bg-white rounded-3 p-3 mb-4">
                <Row className="g-4 ">
                    {/* Gallery ảnh đã sửa đổi bằng Swiper */}
                    <Col lg={6}>
                        <div className="border rounded-3 overflow-hidden position-relative bg-white" style={{ height: 500 }}>
                            <Swiper
                                modules={[Navigation, Pagination]}
                                spaceBetween={0}
                                slidesPerView={1}
                                grabCursor={true}
                                loop={productImages.length > 1}
                                navigation={{
                                    nextEl: '.main-swiper-next',
                                    prevEl: '.main-swiper-prev',
                                }}
                                pagination={{
                                    clickable: true,
                                    dynamicBullets: true
                                }}
                                className="w-100 h-100"
                                onSwiper={(swiper) => {
                                    const targetIndex = productImages.findIndex(
                                        img => img.imageUrl === selectedImage
                                    );

                                    if (targetIndex !== -1) {
                                        swiper.slideToLoop(targetIndex, 0);
                                    }
                                }}
                                onSlideChange={(swiper) => {
                                    const currentImage =
                                        productImages[swiper.realIndex];

                                    if (currentImage) {
                                        setSelectedImage(currentImage.imageUrl);
                                    }
                                }}
                            >
                                {productImages.map((img, index) => (
                                    <SwiperSlide key={img.id} className="d-flex align-items-center justify-content-center p-3">
                                        <img
                                            src={img.imageUrl}
                                            alt={`${product.name}-${index}`}
                                            className="w-100 h-100 object-fit-contain"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => {
                                                setModalActiveIndex(index);
                                                setIsModalOpen(true);
                                            }}
                                        />
                                    </SwiperSlide>
                                ))}
                            </Swiper>

                            {productImages.length > 1 && (
                                <>
                                    <button className="main-swiper-prev position-absolute top-50 start-0 translate-middle-y border-0 bg-white shadow rounded-circle d-flex align-items-center justify-content-center z-3 ms-2 opacity-75" style={{ width: 40, height: 40, cursor: 'pointer' }}>
                                        <ChevronLeft size={22} className="text-dark" />
                                    </button>
                                    <button className="main-swiper-next position-absolute top-50 end-0 translate-middle-y border-0 bg-white shadow rounded-circle d-flex align-items-center justify-content-center z-3 me-2 opacity-75" style={{ width: 40, height: 40, cursor: 'pointer' }}>
                                        <ChevronRight size={22} className="text-dark" />
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="p-2 bg-white mt-2">
                            <div className="d-flex gap-2 flex-wrap justify-content-center">
                                {productImages.map((img, index) => (
                                    <div
                                        key={img.id}
                                        onClick={() => {
                                            setSelectedImage(img.imageUrl);
                                            const mainSwiper = document.querySelector('.swiper')?.swiper;
                                            if (mainSwiper) mainSwiper.slideToLoop(index);
                                        }}
                                        className={`rounded-2 overflow-hidden transition-all ${(selectedImage === img.imageUrl) ? 'border border-primary border-2' : 'border border-light'
                                            }`}
                                        style={{ width: 50, height: 50, cursor: 'pointer' }}
                                    >
                                        <img src={img.imageUrl} alt="thumb" className="w-100 h-100 object-fit-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Col>

                    {/* Thông tin bên phải (GIỮ NGUYÊN) */}
                    <Col lg={6}>
                        <div className="d-flex gap-2 mb-2">
                            <Badge bg="light" text="dark" className="border">{product.categoryName}</Badge>
                            {product.isPrescription && <Badge bg="warning" text="dark">Thuốc kê đơn</Badge>}
                        </div>

                        <p className="fs-4 fw-bold mb-2 text-start">{product.name}</p>

                        {ratingSummary && ratingSummary.totalRatings > 0 && (
                            <div className="d-flex align-items-center gap-2 mb-3 text-muted small">
                                <Star size={14} fill="#f59e0b" color="#f59e0b" />
                                <span className="fw-bold text-dark">{ratingSummary.averageRating}</span>
                                <span>({ratingSummary.totalRatings} đánh giá)</span>
                            </div>
                        )}

                        {!product.prescription && (
                            <div className="d-flex align-items-center gap-3 mb-3">
                                <span className="fs-3 fw-bold" style={{ color: '#1250dc' }}>
                                    {currentVariant?.price?.toLocaleString('vi-VN')}đ
                                </span>
                                {currentVariant.originalPrice > currentVariant.price && (
                                    <>
                                        <span className="text-muted text-decoration-line-through">
                                            {currentVariant.originalPrice.toLocaleString('vi-VN')}đ
                                        </span>
                                        <Badge bg="danger">-{discountPercent}%</Badge>
                                    </>
                                )}
                            </div>
                        )}

                        {product.prescription && (
                            <div className="d-flex align-items-center gap-3 mb-3">
                                <p className='text-muted small mb-1'>sản phẩm cần được tư vấn từ dược sĩ</p>
                            </div>
                        )}

                        <div className="text-start">
                            <div className="mb-3">
                                <label className="text-muted small d-block mb-2">Chọn quy cách đóng gói / Đơn vị:</label>
                                <div className="d-flex flex-wrap gap-2">
                                    {product?.variants?.map((v) => {
                                        const isSelected = selectedVariantId === v.id;
                                        const isOutOfStock = v.stockQuantity <= 0;

                                        return (
                                            <button
                                                key={v.id}
                                                type="button"
                                                disabled={isOutOfStock}
                                                onClick={() => {
                                                    setSelectedVariantId(v.id);
                                                    if (v.imageUrl) {
                                                        setSelectedImage(v.imageUrl);
                                                        const mainSwiper = document.querySelector('.swiper')?.swiper;
                                                        const idx = productImages.findIndex(img => img.imageUrl === v.imageUrl);
                                                        if (mainSwiper && idx !== -1) mainSwiper.slideToLoop(idx);
                                                    }
                                                }}
                                                className={`btn btn-sm text-start px-3 py-2 position-relative d-flex flex-column justify-content-center transition-all ${isSelected
                                                    ? 'btn-primary border-primary'
                                                    : 'btn-outline-secondary border-dashed text-dark bg-light'
                                                    }`}
                                                style={{
                                                    minWidth: '120px',
                                                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                                    opacity: isOutOfStock ? 0.5 : 1,
                                                    borderRadius: '8px',
                                                    border: isSelected ? '2px solid' : '1px dashed #ccc'
                                                }}
                                            >
                                                <span className="fw-bold small">{v.variantName}</span>
                                                <span className={`small mt-1 ${isSelected ? 'text-white-50' : 'text-muted'}`}>
                                                    {v.price?.toLocaleString()}đ
                                                </span>
                                                {isOutOfStock && (
                                                    <span className="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-danger x-small" style={{ fontSize: '10px' }}>
                                                        Hết hàng
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <p className="text-muted small mb-1">
                                Nhà sản xuất: <strong className="text-dark">{product.manufacturer}</strong>
                            </p>
                            <p className="text-muted small mb-1">
                                Xuất xứ: <strong className="text-dark">{product.country}</strong>
                            </p>

                            <div className="small mb-3">
                                <span className="text-muted">Tình trạng:</span>{' '}
                                {currentVariant.stockQuantity > 0
                                    ? <span className="text-success fw-bold">Còn hàng ({currentVariant.stockQuantity})</span>
                                    : <span className="text-danger fw-bold">Hết hàng</span>
                                }
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-3">
                            {!product.prescription && (
                                <div className="d-flex align-items-center border rounded-2 overflow-hidden">
                                    <button className="btn btn-light px-3 py-2 border-0"
                                        onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                                    <span className="px-3 fw-bold">{qty}</span>
                                    <button className="btn btn-light px-3 py-2 border-0"
                                        onClick={() => setQty(q => Math.min(currentVariant.stockQuantity, q + 1))}>+</button>
                                </div>
                            )}
                            <Button
                                variant="primary"
                                className="px-4 py-2 fw-bold d-flex align-items-center justify-content-center"
                                style={{
                                    backgroundColor: product.prescription ? '#ff8300' : '#1250dc',
                                    border: 'none'
                                }}
                                disabled={(!product.prescription && product.stockQuantity === 0) || addingToCart}
                                onClick={product.prescription ? handleContactConsultant : handleAddToCart}
                            >
                                {!product.prescription && <ShoppingCart size={18} className="me-2" />}
                                {product.prescription ? (
                                    'Tư vấn ngay'
                                ) : (
                                    addingToCart ? 'Đang thêm...' : 'Thêm vào giỏ'
                                )}
                            </Button>
                        </div>
                        <p className="text-muted small mb-1 text-start mt-4">
                            {product?.description}
                        </p>
                    </Col>
                </Row>
            </div>

            {/* ── Tabs thông số kỹ thuật chi tiết (GIỮ NGUYÊN) ── */}
            <div className="product-details-tabs mt-4 bg-white rounded-3 p-4 mb-3">
                <div className="row">
                    <div className="col-md-3">
                        <div className="position-sticky" style={{ top: '20px' }}>
                            <nav className="nav flex-column custom-scroll-nav">
                                {product.specifications?.map((spec, index) => (
                                    <a
                                        key={index}
                                        href={`#spec-section-${index}`}
                                        className="border-bottom fs-6 nav-link text-secondary py-2 px-0 transition-all text-start specification-link"
                                        style={{ fontSize: '14px', fontWeight: '500' }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            document.getElementById(`spec-section-${index}`)?.scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'start'
                                            });
                                        }}
                                    >
                                        {spec.specKey}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </div>

                    <div className="col-md-9 ps-md-4">
                        <h6 className="text-start fw-bold text-muted mb-3 uppercase small">Thông tin sản phẩm</h6>
                        <h5 className="text-start fw-bold text-dark border-bottom pb-2 mb-2">
                            {product.name}
                        </h5>

                        <div className="specifications-content-wrapper" style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
                            {product.specifications && product.specifications.length > 0 ? (
                                product.specifications.map((spec, index) => (
                                    <div
                                        key={index}
                                        id={`spec-section-${index}`}
                                        className="mb-2 section-scroll-item"
                                    >
                                        <h5 className="text-start fw-bold text-dark ">
                                            {spec.specKey}
                                        </h5>
                                        <p
                                            className="text-secondary text-start lh-lg"
                                            style={{ whiteSpace: 'pre-line', fontSize: '15px' }}
                                        >
                                            {spec.specValue}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted fst-italic text-start">
                                    Chưa có thông tin thông số kỹ thuật cho sản phẩm này.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Đánh giá sản phẩm (GIỮ NGUYÊN) ── */}
            <section className='bg-white rounded-3 p-3'>
                <p className=" fw-bold mb-2 text-start">Đánh giá sản phẩm ({ratingTotal}) </p>
                {ratingSummary && <RatingSummary summary={ratingSummary} />}

                <div className="d-flex gap-2 flex-wrap mb-4 mt-3">
                    {[null, 5, 4, 3, 2, 1].map(s => (
                        <button key={s ?? 'all'}
                            className={`btn btn-sm ${starFilter === s ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => handleFilterChange(s)}>
                            {s === null ? 'Tất cả' : `${s} ★`}
                        </button>
                    ))}
                </div>

                {isAuthenticated
                    ? <RatingForm onSubmit={handleRatingSubmit} />
                    : <div className="alert alert-info mb-4">
                        <button className="btn btn-link p-0 fw-bold"
                            onClick={() => dispatch(openLoginModal())}>
                            Đăng nhập
                        </button>{' '}để viết đánh giá
                    </div>
                }

                <RatingList
                    ratings={ratings}
                    loading={ratingLoading}
                    isLast={ratingLast}
                    remaining={ratingTotal - ratings.length}
                    onLoadMore={handleLoadMore}
                    currentUserId={user?.id}
                    onDelete={async (ratingId) => {
                        await ratingService.delete(ratingId);
                        setRatings(prev => prev.filter(r => r.id !== ratingId));
                        setRatingTotal(prev => prev - 1);
                    }}
                />
            </section>

            {/* ================================================================= */}
            {/* ─── MODAL XEM ẢNH KIỂU LIGHTBOX ─── */}
            {/* ================================================================= */}
            {isModalOpen && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{
                        zIndex: 10000,
                        backgroundColor: 'rgba(0,0,0,0.35)',
                        backdropFilter: 'blur(4px)',
                        animation: 'fadeIn 0.25s ease'
                    }}
                    onClick={() => setIsModalOpen(false)}
                >

                    {/* BOX CHÍNH */}
                    <div
                        className="bg-white rounded-4 shadow-lg overflow-hidden position-relative d-flex flex-column"
                        style={{
                            width: '80vw',
                            height: '85vh',
                            maxWidth: '1200px',
                            animation: 'zoomIn 0.25s ease',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* HEADER */}
                        <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
                            {/* Thêm class ms-auto vào đây */}
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="btn ms-auto d-flex align-items-center justify-content-center"
                                style={{
                                    width: 50,
                                    height: 50
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* CONTENT */}
                        <div
                            className="flex-grow-1 position-relative d-flex align-items-center justify-content-center bg-light"
                            style={{
                                minHeight: 0
                            }}
                        >

                            <Swiper
                                modules={[Navigation]}
                                initialSlide={modalActiveIndex}
                                spaceBetween={20}
                                slidesPerView={1}
                                grabCursor={true}
                                onSlideChange={(swiper) => {
                                    setModalActiveIndex(swiper.realIndex);

                                    const activeThumb =
                                        thumbnailRefs.current[swiper.realIndex];

                                    activeThumb?.scrollIntoView({
                                        behavior: 'smooth',
                                        inline: 'center',
                                        block: 'nearest'
                                    });
                                }}
                                navigation={{
                                    nextEl: '.modal-swiper-next',
                                    prevEl: '.modal-swiper-prev',
                                }}
                                className="w-100 h-100"
                            >
                                {productImages.map((img, index) => (
                                    <SwiperSlide
                                        key={`modal-${img.id}`}
                                        className="d-flex align-items-center justify-content-center p-4"
                                    >
                                        <img
                                            src={img.imageUrl}
                                            alt={`Modal-View-${index}`}
                                            className="object-fit-contain"
                                            style={{
                                                maxHeight: '100%',
                                                maxWidth: '100%',
                                                borderRadius: '12px'
                                            }}
                                        />
                                    </SwiperSlide>
                                ))}
                            </Swiper>

                            {/* PREV */}
                            <button
                                className="modal-swiper-prev position-absolute top-50 start-0 translate-middle-y border-0 bg-white shadow rounded-circle d-flex align-items-center justify-content-center ms-3 z-3"
                                style={{
                                    width: 48,
                                    height: 48,
                                    cursor: 'pointer'
                                }}
                            >
                                <ChevronLeft size={24} />
                            </button>

                            {/* NEXT */}
                            <button
                                className="modal-swiper-next position-absolute top-50 end-0 translate-middle-y border-0 bg-white shadow rounded-circle d-flex align-items-center justify-content-center me-3 z-3"
                                style={{
                                    width: 48,
                                    height: 48,
                                    cursor: 'pointer'
                                }}
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>

                        {/* THUMBNAILS */}
                        <div
                            className="border-top bg-white px-3 py-3"

                        >
                            {/* SỬA TẠI ĐÂY: Đổi center thành start và thêm flex-nowrap */}
                            <div className="d-flex gap-2 justify-content-start flex-nowrap">

                                {productImages.map((img, index) => (
                                    <div
                                        key={`thumb-modal-${img.id}`}
                                        ref={(el) => (thumbnailRefs.current[index] = el)}
                                        onClick={() => {
                                            setModalActiveIndex(index);

                                            const modalSwiper =
                                                document.querySelector('.fixed-top .swiper')?.swiper;

                                            if (modalSwiper) {
                                                modalSwiper.slideTo(index);
                                            }
                                        }}
                                        className={`rounded-3 overflow-hidden bg-white transition-all ${modalActiveIndex === index
                                            ? 'border border-primary border-3 shadow'
                                            : 'border border-light opacity-75'
                                            }`}
                                        style={{
                                            width: 72,
                                            height: 72,
                                            cursor: 'pointer',
                                            minWidth: 72, // Thuộc tính này rất quan trọng để ảnh không bị bóp méo khi cuộn
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <img
                                            src={img.imageUrl}
                                            alt="thumb"
                                            className="w-100 h-100 object-fit-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ANIMATION */}
                    <style>
                        {`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes zoomIn {
                    from {
                        opacity: 0;
                        transform: scale(0.92) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}
                    </style>
                </div>
            )}
        </Container >
    );
};

export default ProductDetailPage;