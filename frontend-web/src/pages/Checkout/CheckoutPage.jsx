import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { BiMap, BiChevronLeft, BiPurchaseTagAlt } from 'react-icons/bi';
import toast from 'react-hot-toast';
import profileService from '../../services/profileService';
import ghnService from '../../services/ghnService';
import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';
import { FaShoppingCart } from 'react-icons/fa';
import { fetchCart } from '../../redux/slices/cartSlice';

const CheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { items } = useSelector(state => state.cart);

    const selectedIds = location.state?.selectedIds || [];
    console.log("Selected IDs:", selectedIds); // Debug log

    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [loading, setLoading] = useState(false);
    console.log("CheckoutPage rendered with selectedAddressId:", selectedAddressId); // Debug log
    console.log("checkoutpage addresses:", addresses); // Debug log

    // 2. State lưu phí vận chuyển
    const [shippingFee, setShippingFee] = useState(0);
    const [isCalculatingFee, setIsCalculatingFee] = useState(false);
    console.log("check count product:", selectedIds.length); // Debug log

    useEffect(() => {
        if (selectedIds.length === 0) navigate('/cart');
    }, [selectedIds, navigate]);

    const checkoutItems = useMemo(() => {
        return items.filter(item => selectedIds.includes(item.id));
    }, [items, selectedIds]);

    const totalAmount = useMemo(() => {
        return checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [checkoutItems]);

    // 3. Logic kiểm tra miễn phí vận chuyển
    const isFreeShip = totalAmount >= 300000;

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const { data } = await profileService.getAddresses();
                const list = data.result || [];
                setAddresses(list);
                const defaultAddr = list.find(a => a.default) || list[0];
                setSelectedAddressId(defaultAddr?.id);
            } catch (err) {
                toast.error("Lỗi tải địa chỉ");
            }
        };
        fetchAddresses();
    }, []);

    // 4. Hàm tính phí vận chuyển khi địa chỉ thay đổi
    useEffect(() => {
        console.log("CALCULATE FEE EFFECT RUN");
        const calculateFee = async () => {
            // Nếu đã được miễn phí ship thì set bằng 0 và dừng
            console.log("Is Free Ship?", isFreeShip); // Debug log
            if (isFreeShip) {
                setShippingFee(0);
                return;
            }

            const selectedAddr = addresses.find(a => a.id === selectedAddressId);

            // Chỉ tính khi có đầy đủ mã Quận và Phường từ địa chỉ đã chọn
            if (selectedAddr && selectedAddr.districtId && selectedAddr.wardCode) {
                setIsCalculatingFee(true);
                try {
                    const fee = await ghnService.calculateShippingFee({
                        to_district_id: selectedAddr.districtId,
                        to_ward_code: selectedAddr.wardCode,
                        insurance_value: totalAmount // Bảo hiểm theo giá trị đơn hàng
                    });
                    setShippingFee(fee);
                } catch (err) {
                    console.error("Lỗi tính phí GHN:", err);
                    setShippingFee(30000); // Phí mặc định nếu lỗi API
                } finally {
                    setIsCalculatingFee(false);
                }
            }
        };

        calculateFee();
    }, [selectedAddressId, addresses, isFreeShip, totalAmount]);

    // xử lí đặt hàng
    const handlePlaceOrder = async () => {

        if (!selectedAddressId) {
            return toast.error("Vui lòng chọn địa chỉ!");
        }

        if (checkoutItems.length === 0) {
            return toast.error("Không có sản phẩm để thanh toán!");
        }

        try {

            setLoading(true);

            // Build payload gửi backend tạo order
            const payload = {

                addressId: selectedAddressId,

                paymentMethod,

                note: "",

                shippingFee,

                totalAmount,

                items: checkoutItems.map(item => ({
                    variantId: item.variantId,
                    quantity: item.quantity,
                    imageUrl: item.imageUrl
                }))
            };

            /**
             * 1. Tạo đơn hàng trước
             */
            const orderRes =
                await orderService.placeOrder(payload);

            const order =
                orderRes.data.result;

            /**
             * 2. Nếu COD
             */
            if (paymentMethod === 'COD') {

                toast.success("Đặt hàng thành công!");
                dispatch(fetchCart());
                navigate(
                    '/checkout-success',
                    {
                        state: {
                            orderCode: order.orderCode
                        }
                    }
                );

                return;
            }

            /**
             * 3. Nếu VNPay
             */
            if (paymentMethod === 'VNPAY') {
                console.log("Final Amount:", order.finalAmount); // Debug log
                const paymentRes =
                    await paymentService.createVnPayUrl({

                        orderCode: order.orderCode,

                        amount: order.finalAmount
                    });


                const paymentUrl =
                    paymentRes.data.result;

                // Redirect sang VNPay
                window.location.href = paymentUrl;

                return;
            }

        } catch (err) {

            console.error(err);

            toast.error(
                err?.response?.data?.message
                || "Đặt hàng thất bại"
            );

        } finally {

            setLoading(false);
        }
    };
    const goToDetail = (productSlug) => {
        if (productSlug) {
            navigate(`/products/detail/${productSlug}`);
        }
    };

    return (
        <div className="container py-4">
            <button className="btn btn-link text-decoration-none  p-0 mb-3 d-flex align-items-center shadow-none " onClick={() => navigate('/cart')}>
                <BiChevronLeft size={24} /> Quay lại giỏ hàng
            </button>


            <div className="row">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm p-4 mb-4" style={{ fontSize: '.875rem' }}>
                        {/* Banner Miễn phí vận chuyển */}
                        <div className="text-center py-2 mb-2 rounded-3" style={{ backgroundColor: '#f0f7ff', color: '#0d6efd' }}>
                            <small className="fw-bold">Miễn phí vận chuyển <span className="text-dark fw-normal">đối với đơn hàng trên 300.000đ</span></small>
                        </div>
                        <h6 className="fw-bold mb-3 d-flex align-items-center"><FaShoppingCart className="me-2" /> Danh sách sản phẩm</h6>

                        {checkoutItems.map((item, index) => (
                            <div key={item.id} className={`py-2 ${index !== 0 ? 'border-top' : ''}`}>
                                <div className="d-flex align-items-center justify-content-between">
                                    {/* Khối bên trái: Ảnh + Tên */}
                                    <div className="d-flex align-items-center flex-grow-1 " style={{ minWidth: 0 }}>
                                        <div className="flex-shrink-0" onClick={() => goToDetail(item.productSlug)} style={{ cursor: 'pointer' }}>
                                            <img src={item?.imageUrl} alt="" className="rounded border p-1" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                                        </div>
                                        <div className="ms-3 pe-3" onClick={() => goToDetail(item.productSlug)} style={{ cursor: 'pointer', minWidth: 0 }}>
                                            <div className="text-start text-dark mb-1 text-wrap" style={{ fontSize: '0.95rem' }}>
                                                {item?.productName}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Khối bên phải: Giá + Số lượng (Dàn hàng ngang) */}
                                    <div className="d-flex align-items-center flex-shrink-0 ms-auto justify-content-between">
                                        <div className="text-end me-4" style={{ minWidth: '100px' }}>
                                            <div className="fw-bold h6 mb-0 text-nowrap">{item?.priceAtTime?.toLocaleString()}đ</div>

                                        </div>
                                        <div className="text-muted small fw-bold text-nowrap" style={{ minWidth: '60px' }}>
                                            x{item?.quantity} {item?.variantName || 'Hộp'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card border-0 shadow-sm p-4 mb-4">
                        <h6 className="fw-bold mb-3 d-flex align-items-center"><BiMap className="me-2" /> Địa chỉ nhận hàng</h6>
                        <div className="row g-3">
                            {addresses.map(addr => (
                                <div key={addr.id} className="col-md-6">
                                    <div className={`p-3 border rounded cursor-pointer h-100 ${selectedAddressId === addr.id ? 'border-primary bg-light' : ''}`}
                                        onClick={() => setSelectedAddressId(addr.id)}>
                                        <div className="fw-bold small">{addr.fullName} - {addr.phone}</div>
                                        <div className="text-muted x-small mt-1">{addr.fullAddress}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm p-4 mb-4">
                        <h6 className="fw-bold mb-3 d-flex align-items-center">
                            <BiPurchaseTagAlt className="me-2" />
                            Phương thức thanh toán
                        </h6>

                        <div className="d-flex flex-column gap-3">

                            {/* COD */}
                            <div
                                className={`border rounded-3 p-3 cursor-pointer transition ${paymentMethod === 'COD'
                                    ? 'border-primary bg-light'
                                    : ''
                                    }`}
                                onClick={() => setPaymentMethod('COD')}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <div className="text-start fw-bold small">
                                            Thanh toán khi nhận hàng (COD)
                                        </div>
                                        <div className="text-start text-muted small mt-1">
                                            Thanh toán bằng tiền mặt khi nhận thuốc
                                        </div>
                                    </div>

                                    <input
                                        type="radio"
                                        checked={paymentMethod === 'COD'}
                                        onChange={() => setPaymentMethod('COD')}
                                    />
                                </div>
                            </div>

                            {/* VNPAY */}
                            <div
                                className={`border rounded-3 p-3 cursor-pointer transition ${paymentMethod === 'VNPAY'
                                    ? 'border-primary bg-light'
                                    : ''
                                    }`}
                                onClick={() => setPaymentMethod('VNPAY')}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <div className="text-start fw-bold small">
                                            Thanh toán VNPay
                                        </div>
                                        <div className="text-muted small mt-1">
                                            Thanh toán online qua ATM, Visa, QR Code
                                        </div>
                                    </div>

                                    <input
                                        type="radio"
                                        checked={paymentMethod === 'VNPAY'}
                                        onChange={() => setPaymentMethod('VNPAY')}
                                    />
                                </div>
                            </div>

                            {/* MOMO */}
                            <div
                                className={`border rounded-3 p-3 cursor-pointer transition ${paymentMethod === 'MOMO'
                                    ? 'border-primary bg-light'
                                    : ''
                                    }`}
                                onClick={() => setPaymentMethod('MOMO')}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <div className="text-start fw-bold small">
                                            Ví MoMo
                                        </div>
                                        <div className="text-muted small mt-1">
                                            Thanh toán bằng ví điện tử MoMo
                                        </div>
                                    </div>

                                    <input
                                        type="radio"
                                        checked={paymentMethod === 'MOMO'}
                                        onChange={() => setPaymentMethod('MOMO')}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>


                </div>


                <div className="col-lg-4">
                    <p className=''> </p>
                    <div className="card border-0 shadow-sm p-4 sticky-top" style={{ top: '20px', zIndex: 1 }}>
                        <h6 className="fw-bold mb-4">Tổng đơn hàng</h6>
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted small">Tạm tính ({checkoutItems.length} sản phẩm)</span>
                            <span className="fw-bold">{totalAmount.toLocaleString()}đ</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted small">Phí vận chuyển</span>
                            {isFreeShip ? (
                                <span className="text-success small fw-bold">Miễn phí</span>
                            ) : (
                                <span className="fw-bold">
                                    {isCalculatingFee ? "Đang tính..." : `${shippingFee.toLocaleString()}đ`}
                                </span>
                            )}
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between mb-4">
                            <span className="h5 fw-bold">Tổng thanh toán</span>
                            <span className="h5 fw-bold text-danger">
                                {(totalAmount + shippingFee).toLocaleString()}đ
                            </span>
                        </div>

                        <button className="btn btn-primary w-100 py-3 fw-bold shadow-sm"
                            disabled={loading || !selectedAddressId} onClick={handlePlaceOrder}>
                            {loading ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐẶT HÀNG"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;