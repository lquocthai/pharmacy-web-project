import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { BiChevronLeft, BiTrash } from 'react-icons/bi';
import toast from 'react-hot-toast';
import { setCart } from '../../redux/slices/cartSlice';
import cartService from '../../services/cartService';
import cartEmpty from '../../assets/illustration-cart-empty.png';

const CartPage = () => {
    const { id, items } = useSelector(state => state.cart);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [selectedIds, setSelectedIds] = useState([]);

    // --- STATE QUẢN LÝ MODAL XÓA ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const totalPrice = useMemo(() => {
        return items
            .filter(item => selectedIds.includes(item.id))
            .reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [items, selectedIds]);

    const isAllSelected = items.length > 0 && selectedIds.length === items.length;

    const goToDetail = (productSlug) => {
        if (productSlug) {
            navigate(`/products/detail/${productSlug}`);
        }
    };

    // Logic gọi API update số lượng
    const callApiUpdateQuantity = async (itemId, newQuantity) => {
        try {
            const response = await cartService.updateItem(itemId, newQuantity);
            dispatch(setCart(response.data.result));
            toast.success('Cập nhật số lượng thành công');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể cập nhật số lượng');
        }
    };

    const debouncedUpdate = useCallback(
        debounce((itemId, newQuantity) => callApiUpdateQuantity(itemId, newQuantity), 1000),
        []
    );

    const handleQuantityChange = (item, delta) => {
        const newQty = item.quantity + delta;
        if (newQty < 1) return;

        const updatedItems = items.map(i =>
            i.id === item.id ? { ...i, quantity: newQty } : i
        );
        dispatch(setCart({ id, items: updatedItems }));
        debouncedUpdate(item.id, newQty);
    };

    const handleInputChange = (item, value) => {
        let newQty = parseInt(value);
        if (isNaN(newQty)) return;
        if (newQty < 1) newQty = 1;

        const updatedItems = items.map(i =>
            i.id === item.id ? { ...i, quantity: newQty } : i
        );
        dispatch(setCart({ id, items: updatedItems }));
        debouncedUpdate(item.id, newQty);
    };

    const toggleItem = (itemId) => {
        setSelectedIds(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const toggleAll = () => {
        setSelectedIds(isAllSelected ? [] : items.map(item => item.id));
    };

    // --- XOÁ SẢN PHẨM: BƯỚC 1 (MỞ MODAL) ---
    const handleConfirmRemove = (itemId) => {
        setItemToDelete(itemId); // Lưu lại ID món hàng muốn xóa
        setIsModalOpen(true);     // Bật modal lên
    };

    // --- XOÁ SẢN PHẨM: BƯỚC 2 (GỌI API KHI CHẮC CHẮN XOÁ) ---
    const handleRemoveItem = async () => {
        if (!itemToDelete) return;
        try {
            const response = await cartService.removeItem(itemToDelete);
            dispatch(setCart(response.data.result));
            toast.success('Đã xóa sản phẩm');
            setSelectedIds(prev => prev.filter(id => id !== itemToDelete));
        } catch (error) {
            toast.error('Xóa thất bại');
        } finally {
            // Reset trạng thái và đóng modal
            setIsModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleCheckout = () => {
        if (selectedIds.length === 0) return toast.error("Chọn sản phẩm!");
        navigate('/checkout', { state: { selectedIds } });
    };

    // Hiển thị giỏ hàng trống
    if (!items || items.length === 0) {
        return (
            <div className="container mb-2 text-center py-1">
                <button style={{ fontSize: '0.875em' }} className="btn text-decoration-none p-0 mb-3 d-flex align-items-center shadow-none btn-link" onClick={() => navigate('/')}>
                    <BiChevronLeft size={24} /> Tiếp tục mua sắm
                </button>

                <div className="d-flex flex-column align-items-center justify-content-center">
                    <div className="mb-4">
                        <img src={cartEmpty} alt="Cart is empty" className="img-fluid" style={{ maxWidth: '300px' }} />
                    </div>
                    <h5 className="fw-bold text-dark mb-2">Chưa có sản phẩm nào trong giỏ</h5>
                    <p className="text-muted mb-2 px-3" style={{ maxWidth: '500px' }}>
                        Cùng khám phá hàng ngàn sản phẩm tại Nhà thuốc Quốc Thái nhé!
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="btn text-white fw-bold px-4 py-2 rounded-pill shadow-sm"
                        style={{ backgroundColor: '#1250dc', border: 'none', fontSize: '15px', paddingLeft: '2rem', paddingRight: '2rem' }}
                    >
                        Khám phá ngay
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-1 position-relative">
            <button style={{ fontSize: '0.875em' }} className="btn text-decoration-none p-0 mb-3 d-flex align-items-center shadow-none btn-link" onClick={() => navigate('/')}>
                <BiChevronLeft size={24} /> Tiếp tục mua sắm
            </button>

            <div className="row">
                <div className="col-lg-8 pb-2">
                    <div className="card border-0 shadow-sm p-3" style={{ fontSize: '.875rem' }}>
                        <div className="text-center py-2 mb-2 rounded-3" style={{ backgroundColor: '#f0f7ff', color: '#0d6efd' }}>
                            <small className="fw-bold">Miễn phí vận chuyển <span className="text-dark fw-normal">đối với đơn hàng trên 300.000đ</span></small>
                        </div>
                        <div className="d-flex align-items-center mb-3">
                            <input
                                type="checkbox"
                                className="form-check-input me-2"
                                checked={isAllSelected}
                                onChange={toggleAll}
                            />
                            <span>Chọn tất cả ({items.length})</span>
                        </div>

                        {items.map(item => (
                            <div key={item.id} className="row align-items-center border-bottom py-2 mx-0">
                                <div className="col-1 p-0">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={selectedIds.includes(item.id)}
                                        onChange={() => toggleItem(item.id)}
                                    />
                                </div>
                                <div className="col-1 p-0" onClick={() => goToDetail(item.productSlug)} style={{ cursor: 'pointer' }}>
                                    <img src={item.imageUrl} className="img-fluid rounded border" alt="" />
                                </div>
                                <div className="col-3" onClick={() => goToDetail(item.productSlug)} style={{ cursor: 'pointer' }}>
                                    <p className="text-start mb-0 text-wrap" style={{ lineHeight: '1.4', wordBreak: 'break-word' }}>
                                        {item.productName}
                                    </p>
                                </div>
                                <div className="col-2">
                                    <div className="input-group input-group-sm border rounded overflow-hidden" >
                                        <button className="btn btn-light border-0 px-2"
                                            onClick={() => handleQuantityChange(item, -1)}
                                            disabled={item.quantity <= 1}>-</button>
                                        <input
                                            type="number"
                                            className="form-control border-0 text-center bg-white shadow-none"
                                            value={item.quantity}
                                            onChange={(e) => handleInputChange(item, e.target.value)}
                                        />
                                        <button className="btn btn-light border-0 px-2"
                                            onClick={() => handleQuantityChange(item, 1)}>+</button>
                                    </div>
                                </div>
                                <div className="col-2 text-end">
                                    {(item.price * item.quantity).toLocaleString()}đ
                                </div>
                                <div className="col-2 text-start">
                                    <p className="text-start mb-0 text-truncate">{item.variantName}</p>
                                </div>
                                <div className="col-1 text-start">
                                    {/* THAY ĐỔI: Gọi hàm handleConfirmRemove thay vì gọi thẳng hàm xóa */}
                                    <button className="btn text-secondary" onClick={() => handleConfirmRemove(item.id)}>
                                        <BiTrash size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-lg-4 pb-2">
                    <div className="card border-0 shadow-sm p-4 sticky-top" style={{ top: '20px', zIndex: 1 }}>
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Tạm tính ({selectedIds.length} món)</span>
                            <span>{totalPrice.toLocaleString()}đ</span>
                        </div>
                        <div className="d-flex justify-content-between mb-4">
                            <span className="h5 fw-bold">Tổng tiền</span>
                            <span style={{ color: '#0d6efd' }} className="h5 fw-bold ">{totalPrice.toLocaleString()}đ</span>
                        </div>
                        <button className="btn btn-primary w-100 py-3 fw-bold shadow-sm"
                            disabled={selectedIds.length === 0} onClick={handleCheckout}>
                            MUA NGAY
                        </button>
                        <div className="text-center indent-4 py-4" style={{ borderRadius: '50px' }}>
                            <span style={{ fontSize: '0.8125rem' }}>Bằng việc tiến hành đặt mua hàng, bạn đồng ý với </span>
                            <a style={{ fontSize: '0.8125rem' }} className="font-medium underline underline-offset-[3px] whitespace-nowrap" href="/chinh-sach/tos">Điều khoản dịch vụ</a>
                            <span style={{ fontSize: '0.8125rem' }}> của Nhà thuốc Quốc Thái</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ======================================================= */}
            {/* HTML/CSS CUSTOM DIALOG MODAL (CHẤT LƯỢNG GIỐNG 100% ẢNH MẪU) */}
            {/* ======================================================= */}
            {isModalOpen && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.45)',
                        zIndex: 9999,
                        backdropFilter: 'blur(2px)'
                    }}
                >
                    <div
                        className="bg-white rounded-4 p-4 text-center position-relative shadow-lg border-0 m-3"
                        style={{ maxWidth: '380px', width: '100%', animation: 'fadeIn 0.25s ease-out' }}
                    >
                        {/* Nút X đóng góc trên bên phải */}
                        <button
                            className="btn border-0 position-absolute end-0 top-0 p-3 text-secondary shadow-none"
                            onClick={() => setIsModalOpen(false)}
                            style={{ fontSize: '20px', lineHeight: '1' }}
                        >
                            &times;
                        </button>

                        {/* Hình ảnh Thùng rác 3D minh hoạ */}
                        <div className="my-3 d-flex justify-content-center">
                            <div
                                style={{
                                    width: '140px',
                                    height: '140px',
                                    backgroundImage: 'url("https://res.cloudinary.com/dwteb3kyb/image/upload/v1717812140/trash-illustration.png")', // Link ảnh backup hoặc bạn thay bằng ảnh local nếu có
                                    backgroundSize: 'contain',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'center'
                                }}
                            >
                                {/* Nếu không dùng được link ảnh trên, đây là fallback icon vẽ bằng CSS giống hệt hình minh hoạ */}
                                {!itemToDelete ? null : (
                                    <div className="w-100 h-100 d-flex align-items-center justify-content-center position-relative">
                                        <div className="rounded-circle bg-light d-flex align-items-center justify-content-center shadow-sm" style={{ width: '90px', height: '90px', backgroundColor: '#eef4ff' }}>
                                            <BiTrash size={48} color="#1250dc" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tiêu đề & Nội dung */}
                        <h5 className="fw-bold text-dark mb-2" style={{ fontSize: '18px' }}>Thông báo</h5>
                        <p className="text-muted px-2 mb-4" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                            Bạn chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?
                        </p>

                        {/* Nhóm Button bấm */}
                        <div className="d-flex gap-2 justify-content-center">
                            <button
                                className="btn rounded-pill fw-bold border-0 px-4 py-2 flex-grow-1 shadow-none"
                                style={{ backgroundColor: '#edf2f9', color: '#1250dc', fontSize: '14px' }}
                                onClick={() => setIsModalOpen(false)}
                            >
                                Đóng
                            </button>
                            <button
                                className="btn rounded-pill fw-bold text-white border-0 px-4 py-2 flex-grow-1 shadow-none"
                                style={{ backgroundColor: '#1250dc', fontSize: '14px' }}
                                onClick={handleRemoveItem}
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Thêm keyframe animation nhỏ cho mượt */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.92); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default CartPage;