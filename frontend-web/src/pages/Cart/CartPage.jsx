import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

const CartPage = () => {
    const { items } = useSelector(state => state.cart);

    // state chọn sản phẩm
    const [selectedIds, setSelectedIds] = useState([]);

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
                                <div key={item.id} className="row align-items-center border-bottom py-3">

                                    {/* checkbox */}
                                    <div className="col-1">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={isChecked}
                                            onChange={() => toggleItem(item.id)}
                                        />
                                    </div>

                                    {/* image */}
                                    <div className="col-2">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.productName}
                                            className="img-fluid"
                                        />
                                    </div>

                                    {/* name */}
                                    <div className="col-4">
                                        <p className="mb-0 fw-bold">
                                            {item.productName}
                                        </p>
                                    </div>

                                    {/* price */}
                                    <div className="col-2 text-primary fw-bold">
                                        {item.price.toLocaleString()}đ
                                    </div>

                                    {/* quantity */}
                                    <div className="col-2">
                                        <div className="input-group input-group-sm">
                                            <button className="btn btn-outline-secondary">-</button>
                                            <input
                                                type="text"
                                                className="form-control text-center"
                                                value={item.quantity}
                                                readOnly
                                            />
                                            <button className="btn btn-outline-secondary">+</button>
                                        </div>
                                    </div>

                                    {/* delete */}
                                    <div className="col-1 text-end">
                                        <i className="bi bi-trash"></i>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm p-3">

                        <div className="d-flex justify-content-between">
                            <span>Tổng tiền</span>
                            <span className="fw-bold">
                                {totalPrice.toLocaleString()}đ
                            </span>
                        </div>

                        <hr />

                        <button
                            className="btn btn-primary w-100 py-2"
                            disabled={selectedIds.length === 0}
                        >
                            Mua hàng
                        </button>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default CartPage;