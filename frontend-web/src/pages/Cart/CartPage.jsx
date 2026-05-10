import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import debounce from 'lodash/debounce';
import { BiTrash } from 'react-icons/bi';
import toast from 'react-hot-toast';
import { setCart } from '../../redux/slices/cartSlice';
import cartService from '../../services/cartService';

const CartPage = () => {
    const { id, items } = useSelector(state => state.cart);
    const navigate = useNavigate(); // 2. Khởi tạo navigate
    // state chọn sản phẩm
    const [selectedIds, setSelectedIds] = useState([]);
    const dispatch = useDispatch();
    // --- 1. XỬ LÝ DEBOUNCE CẬP NHẬT SỐ LƯỢNG ---
    const callApiUpdateQuantity = async (itemId, newQuantity) => {
        console.log("Gọi API cập nhật số lượng:", itemId, newQuantity);
        try {
            const response = await cartService.updateItem(itemId, newQuantity);
            // Cập nhật lại Redux Store với dữ liệu mới nhất từ Backend (CartResponse)
            dispatch(setCart(response.data.result));
            toast.success("Cập nhật số lượng thành công");
        } catch (error) {
            console.error("API Error:", error);
            toast.error(error.response?.data?.message || "Không thể cập nhật số lượng");
        }
    };

    const debouncedUpdate = useCallback(
        debounce((itemId, newQuantity) => callApiUpdateQuantity(itemId, newQuantity), 1000),
        []
    );

    // --- 2. XỬ LÝ TĂNG / GIẢM / NHẬP ---
    const handleQuantityChange = (item, delta) => {
        const newQty = item.quantity + delta;
        if (newQty < 1) return;

        // Cập nhật UI tạm thời trong Redux để người dùng thấy số thay đổi ngay
        const updatedItems = items.map(i =>
            i.id === item.id ? { ...i, quantity: newQty } : i
        );
        dispatch(setCart({
            id,
            items: updatedItems
        })); // Cập nhật local store

        // Gọi API sau 3s
        debouncedUpdate(item.id, newQty);
    };

    const handleInputChange = (item, value) => {
        let newQty = parseInt(value);
        if (isNaN(newQty)) return; // Đợi người dùng nhập số
        if (newQty < 1) newQty = 1;

        const updatedItems = items.map(i =>
            i.id === item.id ? { ...i, quantity: newQty } : i
        );
        dispatch(setCart({
            id,
            items: updatedItems
        }));
        debouncedUpdate(item.id, newQty);
    };


    // tính tổng tiền
    const totalPrice = useMemo(() => {
        return items
            .filter(item => selectedIds.includes(item.id))
            .reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [items, selectedIds]);

    // chọn từng item
    const toggleItem = (id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id]
        );
    };

    // chọn tất cả
    const toggleAll = () => {
        if (selectedIds.length === items.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(items.map(item => item.id));
        }
    };
    // hàm xử lí đều hướng
    const goToDetail = (productSlug) => {
        console.log(productSlug);
        if (productSlug) {
            navigate(`/products/detail/${productSlug}`);
        }
    };
    // --- XỬ LÝ XÓA ---
    const handleRemoveItem = async (itemId) => {
        if (window.confirm("Xóa sản phẩm này khỏi giỏ hàng?")) {
            try {
                const response = await cartService.removeItem(itemId);
                dispatch(setCart(response.data.result));
                toast.success("Đã xóa sản phẩm");
                // Cập nhật lại danh sách đã chọn nếu item bị xóa đang được chọn
                setSelectedIds(prev => prev.filter(id => id !== itemId));
            } catch (error) {
                toast.error("Xóa thất bại");
            }
        }
    };

    const isAllSelected = items.length > 0 && selectedIds.length === items.length;

    return (
        <div className="container py-4">
            <div className="row">

                {/* LEFT */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm p-3">

                        {/* CHỌN TẤT CẢ */}
                        <div className="d-flex align-items-center mb-3">
                            <input
                                type="checkbox"
                                className="form-check-input me-2"
                                checked={isAllSelected}
                                onChange={toggleAll}
                            />
                            <span>Chọn tất cả ({items.length})</span>
                        </div>

                        {/* LIST ITEM */}
                        {items.map(item => {
                            const isChecked = selectedIds.includes(item.id);

                            return (
                                <div key={item.id} className="row align-items-center border-bottom py-3 mx-0">
                                    {/* Checkbox */}
                                    <div className="col-1 p-0">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={isChecked}
                                            onChange={() => toggleItem(item.id)}
                                        />
                                    </div>

                                    {/* Image */}
                                    <div className="col-2" onClick={() => goToDetail(item.productSlug)} style={{ cursor: 'pointer' }}>
                                        <img src={item.imageUrl} alt={item.productName} className="img-fluid rounded border" />
                                    </div>

                                    {/* Name */}
                                    <div className="col-3" onClick={() => goToDetail(item.productSlug)} style={{ cursor: 'pointer' }}>
                                        <p className="mb-0 fw-bold text-truncate">{item.productName}</p>
                                        <small className="text-muted">{item.price.toLocaleString()}đ</small>
                                    </div>

                                    {/* Quantity */}
                                    <div className="col-2">
                                        <div className="input-group input-group-sm border rounded overflow-hidden"
                                            style={{ width: '110px' }}>
                                            <button
                                                className="btn btn-light border-0 px-2"
                                                onClick={() => handleQuantityChange(item, -1)}
                                                disabled={item.quantity <= 1}
                                            >
                                                <i className="bi bi-dash-lg"></i> -
                                            </button>
                                            <input
                                                type="number"
                                                className="form-control border-0 text-center bg-white shadow-none"
                                                value={item.quantity}
                                                min="1"
                                                onChange={(e) => handleInputChange(item, e.target.value)}
                                            />
                                            <button
                                                className="btn btn-light border-0 px-2"
                                                onClick={() => handleQuantityChange(item, 1)}
                                            >
                                                <i className="bi bi-plus-lg"></i> +
                                            </button>
                                        </div>
                                    </div>

                                    {/* Subtotal */}
                                    <div className="col-2 text-end">
                                        {(item.price * item.quantity).toLocaleString()}đ
                                    </div>

                                    {/* unit */}
                                    <div className="col-1 text-end">
                                        {item.unit}
                                    </div>

                                    {/* Delete Button */}
                                    <div className="col-1 text-end">
                                        <button
                                            className="btn btn-sm border-0 p-2 shadow-none custom-delete-btn"
                                            style={{ color: 'gray' }}
                                            onClick={() => handleRemoveItem(item.id)}
                                            title="Xóa khỏi giỏ hàng"
                                        >
                                            <BiTrash size={20} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm p-4 sticky-top" style={{ top: '20px' }}>
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Tạm tính ({selectedIds.length} sản phẩm)</span>
                            <span>{totalPrice.toLocaleString()}đ</span>
                        </div>
                        <div className="d-flex justify-content-between mb-4">
                            <span className="h5 fw-bold">Tổng tiền</span>
                            <span className="h5 fw-bold text-danger">{totalPrice.toLocaleString()}đ</span>
                        </div>
                        <button className="btn btn-primary w-100 py-3 fw-bold shadow-sm" disabled={selectedIds.length === 0}>
                            MUA NGAY
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CartPage;