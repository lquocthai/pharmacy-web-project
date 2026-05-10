import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Badge, Button, Tab, Nav, Spinner, Alert } from 'react-bootstrap';
import { ShoppingCart, Star } from 'lucide-react';
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

const ProductDetailPage = () => {
    const { slug } = useParams();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector(state => state.auth);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Ảnh đang chọn trong gallery
    const [selectedImage, setSelectedImage] = useState(null);

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

    // Load product detail
    useEffect(() => {
        console.log('Loading product detail for slug:', slug);
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data } = await productService.getDetail(slug);
                if (data.code !== 0) throw new Error(data.message);
                setProduct(data.result);
                setRatingSummary(data.result.ratingSummary);
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
        setAddingToCart(true);
        try {
            const { data } = await cartService.addItem({ productId: product.id, quantity: qty });
            if (data.code === 0) dispatch(setCart(data.result));
            toast.success(`Thêm vào giỏ hàng thành công ${qty}`);
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
            // Thêm đánh giá mới vào đầu danh sách
            setRatings(prev => [data.result, ...prev]);
            setRatingTotal(prev => prev + 1);
            // Cập nhật summary
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
        toast('Chức năng tư vấn đang được phát triển. Vui lòng liên hệ cửa hàng để được hỗ trợ!');
    }

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

    const discountPercent = product.oldPrice > product.price
        ? Math.round((1 - product.price / product.oldPrice) * 100)
        : 0;

    return (
        <Container className="py-4">
            {/* ── Thông tin sản phẩm ── */}
            <Row className="g-4 mb-5 bg-white p-3 rounded-3">
                {/* Gallery ảnh */}
                <Col lg={5}>
                    {/* KHUNG CHUNG: Border bao quanh tất cả */}
                    <div className="border rounded-3 overflow-hidden d-flex flex-column"
                        style={{ height: 500, background: 'white' }}>

                        {/* VÙNG 1: Ảnh lớn - Tự động co giãn để không bao giờ bị phần dưới che */}
                        <div className="flex-grow-1 d-flex align-items-center justify-content-center p-3"
                            style={{ minHeight: 0 }}> {/* minHeight: 0 rất quan trọng trong flex để tránh vỡ khung */}
                            {selectedImage ? (
                                <img
                                    src={selectedImage}
                                    alt={product.name}
                                    className="w-100 h-100 object-fit-contain"
                                />
                            ) : (
                                <div className="text-muted">Chưa có ảnh</div>
                            )}
                        </div>

                        {/* VÙNG 2: Thumbnails - Luôn nằm cố định ở đáy khung hình */}
                        <div className="p-3 bg-white border-top">
                            <div className="d-flex gap-2 flex-wrap justify-content-center">
                                {product.images?.map(img => (
                                    <div
                                        key={img.id}
                                        onClick={() => setSelectedImage(img.imageUrl)}
                                        className={`rounded-2 overflow-hidden transition-all ${selectedImage === img.imageUrl
                                            ? 'border border-primary border-2'
                                            : 'border border-light'
                                            }`}
                                        style={{
                                            width: 50,
                                            height: 50,
                                            cursor: 'pointer'
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
                </Col>

                {/* Thông tin */}
                <Col lg={7}>
                    <div className="d-flex gap-2 mb-2">
                        <Badge bg="light" text="dark" className="border">{product.categoryName}</Badge>
                        {product.isPrescription && <Badge bg="warning" text="dark">Thuốc kê đơn</Badge>}
                    </div>

                    <p className="fs-4 fw-bold mb-2 text-start">{product.name}</p>

                    {/* Rating inline */}
                    {ratingSummary && ratingSummary.totalRatings > 0 && (
                        <div className="d-flex align-items-center gap-2 mb-3 text-muted small">
                            <Star size={14} fill="#f59e0b" color="#f59e0b" />
                            <span className="fw-bold text-dark">{ratingSummary.averageRating}</span>
                            <span>({ratingSummary.totalRatings} đánh giá)</span>
                        </div>
                    )}

                    {/* Giá */}
                    {!product.prescription &&

                        <div className="d-flex align-items-center gap-3 mb-3">
                            <span className="fs-3 fw-bold" style={{ color: '#1250dc' }}>
                                {product.price.toLocaleString('vi-VN')}đ
                            </span>
                            {product.oldPrice > product.price && (
                                <>
                                    <span className="text-muted text-decoration-line-through">
                                        {product.oldPrice.toLocaleString('vi-VN')}đ
                                    </span>
                                    <Badge bg="danger">-{discountPercent}%</Badge>
                                </>
                            )}
                        </div>
                    }
                    {product.prescription && (
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <p className='text-muted small mb-1'>sản phẩm cần được tư vấn từ dược sĩ</p>
                        </div>
                    )}

                    <div className="text-start"> {/* Đảm bảo mọi thứ bên trong bám lề trái */}
                        <p className="text-muted small mb-1">
                            Đơn vị: <strong className="text-dark">{product.unit}</strong>
                        </p>
                        <p className="text-muted small mb-1">
                            Nhà sản xuất: <strong className="text-dark">{product.manufacturer}</strong>
                        </p>
                        <p className="text-muted small mb-1">
                            Xuất xứ: <strong className="text-dark">{product.country}</strong>
                        </p>

                        {/* Tình trạng kho hàng */}
                        <div className="small mb-3">
                            <span className="text-muted">Tình trạng:</span>{' '}
                            {product.stockQuantity > 0
                                ? <span className="text-success fw-bold">Còn hàng ({product.stockQuantity})</span>
                                : <span className="text-danger fw-bold">Hết hàng</span>
                            }
                        </div>
                    </div>

                    {/* Số lượng + Thêm giỏ */}
                    <div className="d-flex align-items-center gap-3">
                        {!product.prescription &&
                            <div className="d-flex align-items-center border rounded-2 overflow-hidden">
                                <button className="btn btn-light px-3 py-2 border-0"
                                    onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                                <span className="px-3 fw-bold">{qty}</span>
                                <button className="btn btn-light px-3 py-2 border-0"
                                    onClick={() => setQty(q => Math.min(product.stockQuantity, q + 1))}>+</button>
                            </div>

                        }
                        <Button
                            variant="primary"
                            className="px-4 py-2 fw-bold d-flex align-items-center justify-content-center"
                            style={{
                                backgroundColor: product.prescription ? '#ff8300' : '#1250dc', // Đổi sang màu cam cho "Tư vấn" để dễ phân biệt
                                border: 'none'
                            }}
                            disabled={(!product.prescription && product.stockQuantity === 0) || addingToCart}
                            onClick={product.prescription ? handleContactConsultant : handleAddToCart}
                        >
                            {/* Chỉ hiện Icon Shopping khi KHÔNG PHẢI thuốc kê đơn */}
                            {!product.prescription && <ShoppingCart size={18} className="me-2" />}

                            {product.prescription ? (
                                'Tư vấn ngay'
                            ) : (
                                addingToCart ? 'Đang thêm...' : 'Thêm vào giỏ'
                            )}
                        </Button>
                    </div>
                    <p className="text-muted small mb-1 text-start mt-4">
                        {product?.detail?.description}
                    </p>
                </Col>
            </Row>
            <div className="product-details-tabs mt-4 bg-white rounded-3 p-3 mb-3">
                <Tab.Container defaultActiveKey="composition">
                    <Nav className="custom-tab-nav mb-4 align-items-center">
                        <Nav.Item>
                            <Nav.Link eventKey="composition">Thành phần</Nav.Link>
                        </Nav.Item>
                        <div className="tab-divider"></div>
                        <Nav.Item>
                            <Nav.Link eventKey="usage">Hướng dẫn sử dụng</Nav.Link>
                        </Nav.Item>
                        <div className="tab-divider"></div>
                        <Nav.Item>
                            <Nav.Link eventKey="sideEffects">Tác dụng phụ</Nav.Link>
                        </Nav.Item>
                        <div className="tab-divider"></div>
                        <Nav.Item>
                            <Nav.Link eventKey="storage">Bảo quản</Nav.Link>
                        </Nav.Item>
                    </Nav>

                    <Tab.Content className="p-4 border-0 bg-white rounded-4" style={{ padding: '5px' }}>
                        {[
                            { key: 'composition', value: product.detail?.composition },
                            { key: 'usage', value: product.detail?.usage },
                            { key: 'sideEffects', value: product.detail?.sideEffects },
                            { key: 'storage', value: product.detail?.storage },
                        ].map(({ key, label, value }) => (
                            <Tab.Pane key={key} eventKey={key} className="fade">
                                <h5 className="fw-bold mb-3">{label}</h5>
                                {value ? (
                                    <p className="text-secondary text-start" style={{ whiteSpace: 'pre-line', lineHeight: '1.8' }}>
                                        {value}
                                    </p>
                                ) : (
                                    <p className="text-muted fst-italic">Chưa có thông tin {label.toLowerCase()}.</p>
                                )}
                            </Tab.Pane>
                        ))}
                    </Tab.Content>
                </Tab.Container>
            </div>
            {/* ── Đánh giá ── */}
            <section className='bg-white rounded-3 p-3'>
                <p className=" fw-bold mb-2 text-start">Đánh giá sản phẩm ({ratingTotal}) </p>

                {/* Tổng hợp rating */}
                {ratingSummary && <RatingSummary summary={ratingSummary} />}

                {/* Filter theo sao */}
                <div className="d-flex gap-2 flex-wrap mb-4 mt-3">
                    {[null, 5, 4, 3, 2, 1].map(s => (
                        <button key={s ?? 'all'}
                            className={`btn btn-sm ${starFilter === s ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => handleFilterChange(s)}>
                            {s === null ? 'Tất cả' : `${s} ★`}
                        </button>
                    ))}
                </div>
                {/* đăng nhập để đánh giá */}
                {/* Form đánh giá */}
                {isAuthenticated
                    ? <RatingForm onSubmit={handleRatingSubmit} />
                    : <div className="alert alert-info mb-4">
                        <button className="btn btn-link p-0 fw-bold"
                            onClick={() => dispatch(openLoginModal())}>
                            Đăng nhập
                        </button>{' '}để viết đánh giá
                    </div>
                }

                {/* Danh sách đánh giá */}
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
        </Container >
    );
};

export default ProductDetailPage;
