import { useLocation, useNavigate } from 'react-router-dom';

const CheckoutSuccessPage = () => {

    const navigate = useNavigate();

    const location = useLocation();

    const orderCode =
        location.state?.orderCode;

    return (

        <div className="container py-5 text-center">

            <div className="card border-0 shadow-sm p-5">

                <h2 className="text-success fw-bold mb-3">
                    Đặt hàng thành công
                </h2>

                <p className="text-muted mb-4">
                    Mã đơn hàng:
                    <strong> {orderCode}</strong>
                </p>

                <div className="d-flex justify-content-center gap-3">

                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/profile/orders')}
                    >
                        Xem đơn hàng của bạn
                    </button>

                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => navigate('/')}
                    >
                        Tiếp tục mua sắm
                    </button>

                </div>
            </div>
        </div>
    );
};

export default CheckoutSuccessPage;