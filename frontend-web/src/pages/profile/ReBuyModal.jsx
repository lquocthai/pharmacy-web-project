import React, { useState } from 'react';
import { Modal, Button, Spinner } from "react-bootstrap";
import { useDispatch } from 'react-redux';
import { setCart } from '../../redux/slices/cartSlice';
import cartService from '../../services/cartService';
import toast from 'react-hot-toast';

const ReBuyModal = ({ show, onHide, selectedOrderItems }) => {
    const dispatch = useDispatch();
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    // Hàm Helper định dạng tiền tệ
    const formatCurrency = (amount) => {
        if (typeof amount !== 'number') return '0đ';
        return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
    };

    // --- XỬ LÝ API MUA LẠI NGAY TẠI MODAL CON ---
    const handleAddReorderToCart = async () => {
        if (!selectedOrderItems || selectedOrderItems.length === 0) return;
        // 1. Chuẩn bị mảng dữ liệu sạch (Lọc bỏ các item lỗi ID)
        const itemsToReorder = selectedOrderItems
            .map(item => ({
                variantId: item.variantId,
                quantity: item.quantity || 1
            }))
            .filter(i => i.variantId);
        console.log(itemsToReorder);

        try {
            setIsAddingToCart(true);


            if (itemsToReorder.length === 0) {
                return toast.error("Không tìm thấy sản phẩm hợp lệ để mua lại!");
            }

            // 2. Gọi ĐÚNG 1 request lên API gộp của Backend (Sau khi bạn đã sửa Backend)
            const { data } = await cartService.addListItem(itemsToReorder);

            if (data?.code == 0) {
                dispatch(setCart(data.result));
            }

            toast.success('Đã thêm sản phẩm vào giỏ hàng thành công!');
            onHide(); // Tự động đóng modal sau khi thành công
        } catch (error) {
            console.error("Lỗi mua lại đơn hàng:", error);
            toast.error(error.response?.data?.message || 'Không thể mua lại sản phẩm, vui lòng thử lại!');
        } finally {
            setIsAddingToCart(false);
        }
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            dialogClassName="custom-reorder-modal"
            contentClassName="border-0 rounded-4 shadow"
            size="lg"
            className='z-[10000]'
        >
            <Modal.Header closeButton className="border-0 pb-0 pt-4 px-4 justify-content-center position-relative">
                <Modal.Title className="fw-bold text-dark w-100 text-center fs-5 mt-2">
                    Chọn sản phẩm mua lại
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="px-4 py-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {selectedOrderItems && selectedOrderItems.map((item, index) => (
                    <div
                        key={item.id || index}
                        className="d-flex align-items-center justify-content-between py-3 px-2 rounded-3 mb-2 border-bottom"
                    >
                        <div className="d-flex align-items-center gap-3 flex-grow-1">
                            <div
                                className="border rounded-3 p-1 bg-white d-flex align-items-center justify-content-center shadow-sm"
                                style={{ width: '64px', height: '64px', minWidth: '64px' }}
                            >
                                <img
                                    src={item.imageUrl}
                                    alt={item.productName}
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                    onError={(e) => { e.target.src = "https://placehold.co/64x64?text=DuocPham"; }}
                                />
                            </div>
                            <div className="flex-grow-1">
                                <p className="mb-0 text-dark small fw-medium text-wrap" style={{ lineHeight: '1.4', maxWidth: '420px' }}>
                                    {item.productName}
                                </p>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-4 text-nowrap">
                            <span className="fw-bold text-dark fs-6">
                                {formatCurrency(item.priceAtTime)}
                            </span>
                            <span className="text-muted small">
                                x{item.quantity} {item.variantName || 'Ống'}
                            </span>
                        </div>
                    </div>
                ))}
            </Modal.Body>

            <Modal.Footer className="border-0 pt-2 pb-4 px-4 justify-content-center">
                <Button
                    onClick={handleAddReorderToCart}
                    disabled={isAddingToCart || !selectedOrderItems || selectedOrderItems.length === 0}
                    className="w-100 py-3 fw-bold text-white rounded-pill border-0 shadow-sm transition-all"
                    style={{
                        backgroundColor: '#1250dc',
                        fontSize: '16px',
                        letterSpacing: '0.3px'
                    }}
                >
                    {isAddingToCart ? (
                        <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Đang xử lý...
                        </>
                    ) : (
                        "Thêm vào giỏ hàng"
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ReBuyModal;