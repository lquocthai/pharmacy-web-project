import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import orderService from '../../services/orderService';

const PaymentResultPage = () => {
    console.log('PAYMENT RESULT PAGE');
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    console.log(searchParams.toString());

    const orderCode =
        searchParams.get('vnp_TxnRef');

    const [loading, setLoading] = useState(true);

    const [order, setOrder] = useState(null);

    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {

        const fetchOrder = async () => {

            try {

                const { data } =
                    await orderService.getOrderByCode(orderCode);

                const orderData = data.result;

                setOrder(orderData);
                console.log(`Fetched order:`, orderData);

                setIsSuccess(
                    orderData.paymentStatus === 'PAID'
                );

            } catch (error) {

                console.error(error);

            } finally {

                setLoading(false);
            }
        };

        if (orderCode) {
            fetchOrder();
        } else {
            setLoading(false);
        }

    }, [orderCode]);

    if (loading) {

        return (

            <div className="container py-5 text-center">

                <div className="card border-0 shadow-sm p-5">

                    <div className="spinner-border mb-3" />

                    <h5>Đang kiểm tra thanh toán...</h5>

                </div>

            </div>
        );
    }

    return (

        <div className="container py-5">

            <div
                className="card border-0 shadow-sm p-5 text-center mx-auto"
                style={{ maxWidth: 600 }}
            >

                <div className="mb-4">

                    <div
                        className={`mx-auto rounded-circle d-flex align-items-center justify-content-center 
                        ${isSuccess ? 'bg-success-subtle' : 'bg-danger-subtle'}`}
                        style={{
                            width: 90,
                            height: 90
                        }}
                    >

                        <span
                            className={`fw-bold fs-1 
                            ${isSuccess ? 'text-success' : 'text-danger'}`}
                        >
                            {isSuccess ? '✓' : '✕'}
                        </span>

                    </div>

                </div>

                <h2
                    className={`fw-bold mb-3 
                    ${isSuccess ? 'text-success' : 'text-danger'}`}
                >

                    {isSuccess
                        ? 'Thanh toán thành công'
                        : 'Thanh toán thất bại'}

                </h2>

                <p className="text-muted mb-2">
                    Mã đơn hàng
                </p>

                <h5 className="fw-bold mb-4">
                    {orderCode}
                </h5>

                {order && (

                    <div className="bg-light rounded p-3 mb-4 text-start">

                        <div className="d-flex justify-content-between mb-2">
                            <span>Tổng thanh toán</span>
                            <strong className="text-danger">
                                {order.finalAmount?.toLocaleString()}đ
                            </strong>
                        </div>

                        <div className="d-flex justify-content-between mb-2">
                            <span>Phương thức</span>
                            <strong>
                                {order.paymentMethod}
                            </strong>
                        </div>

                        <div className="d-flex justify-content-between">
                            <span>Trạng thái</span>
                            <strong
                                className={
                                    isSuccess
                                        ? 'text-success'
                                        : 'text-danger'
                                }
                            >
                                {order.paymentStatus}
                            </strong>
                        </div>

                    </div>
                )}

                <div className="d-flex gap-3 justify-content-center">

                    <button
                        className="btn btn-outline-secondary px-4"
                        onClick={() => navigate('/')}
                    >
                        Về trang chủ
                    </button>

                    <button
                        className="btn btn-primary px-4"
                        onClick={() => navigate('/profile?tab=orders')}
                    >
                        Xem đơn hàng của bạn
                    </button>

                </div>

            </div>

        </div>
    );
};

export default PaymentResultPage;