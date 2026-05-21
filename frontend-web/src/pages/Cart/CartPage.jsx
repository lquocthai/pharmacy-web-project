import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { BiTrash } from 'react-icons/bi';
import toast from 'react-hot-toast';
import { setCart } from '../../redux/slices/cartSlice';
import cartService from '../../services/cartService';
import { size } from 'lodash';

const CartPage = () => {
    const { id, items } = useSelector(state => state.cart);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [selectedIds, setSelectedIds] = useState([]);

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

    // 2. Logic gọi API (Giữ nguyên debounce 1s)
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

        // Cập nhật Redux ngay lập tức để UI nhảy số (Optimistic Update)
        const updatedItems = items.map(i =>
            i.id === item.id ? { ...i, quantity: newQty } : i
        );
        dispatch(setCart({ id, items: updatedItems }));

        // Gọi API sau 1s debounce
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

    // 5. Logic Checkbox & Xóa (Giữ nguyên của bạn)
    const toggleItem = (itemId) => {
        setSelectedIds(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const toggleAll = () => {
        setSelectedIds(isAllSelected ? [] : items.map(item => item.id));
    };

    const handleRemoveItem = async (itemId) => {
        if (!window.confirm('Xóa sản phẩm này khỏi giỏ hàng?')) return;
        try {
            const response = await cartService.removeItem(itemId);
            dispatch(setCart(response.data.result));
            toast.success('Đã xóa sản phẩm');
            setSelectedIds(prev => prev.filter(id => id !== itemId));
        } catch (error) {
            toast.error('Xóa thất bại');
        }
    };

    const handleCheckout = () => {
        if (selectedIds.length === 0) return toast.error("Chọn sản phẩm!");
        navigate('/checkout', { state: { selectedIds } });
    };

    return (
        <div className="container py-4">
            <div className="row">
                <div className="col-lg-8">
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
                            <div key={item.id} className="row align-items-center border-bottom py-3 mx-0">
                                <div className="col-1 p-0">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={selectedIds.includes(item.id)}
                                        onChange={() => toggleItem(item.id)}
                                    />
                                </div>
                                <div className="col-1" onClick={() => goToDetail(item.productSlug)} style={{ cursor: 'pointer' }}>
                                    <img src={item.imageUrl} className="img-fluid rounded border" alt="" />
                                </div>
                                <div className="col-3" onClick={() => goToDetail(item.productSlug)} style={{ cursor: 'pointer' }}>
                                    {/* Bỏ text-truncate và thêm fw-bold nếu muốn tên nổi bật như ảnh mẫu */}
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
                                <div className="text-end col-2 ">
                                    {(item.price * item.quantity).toLocaleString()}đ
                                </div>
                                <div className="text-start col-2 ">
                                    <p className="text-start mb-0 text-truncate">{item.unit}</p>
                                </div>
                                <div className="text-start col-1 ">
                                    <button className="btn text-secondary" onClick={() => handleRemoveItem(item.id)}>
                                        <BiTrash size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>


                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm p-4 sticky-top" style={{ top: '20px', zIndex: 1 }}>
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Tạm tính ({selectedIds.length} món)</span>
                            <span>{totalPrice.toLocaleString()}đ</span>
                        </div>
                        <div className="d-flex justify-content-between mb-4">
                            <span className="h5 fw-bold">Tổng tiền</span>
                            <span className="h5 fw-bold text-danger">{totalPrice.toLocaleString()}đ</span>
                        </div>
                        <button className="btn btn-primary w-100 py-3 fw-bold shadow-sm"
                            disabled={selectedIds.length === 0} onClick={handleCheckout}>
                            MUA NGAY
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;