import { Modal, Button } from 'react-bootstrap';
import { X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setLogout } from '../../redux/slices/authSlice';
import { clearCart } from '../../redux/slices/cartSlice';
import authService from '../../services/authService';

const LogoutModal = ({ show, handleClose }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            dispatch(setLogout());   // clear auth Redux + localStorage
            dispatch(clearCart());   // clear cart Redux
            handleClose();
            navigate('/');
        }
    };
    return (
        <Modal
            show={show}
            backdrop="static"
            keyboard={false}
            onHide={handleClose}
            centered
            contentClassName="border-0 rounded-4 shadow-lg"
            size="sm"
            style={{ margin: 'auto' }}
        >
            {/* Nút đóng góc trên bên phải */}
            <div className="position-absolute end-0 top-0 m-3" style={{ zIndex: 1 }}>
                <X
                    size={24}
                    className="text-secondary cursor-pointer"
                    onClick={handleClose}
                    style={{ cursor: 'pointer' }}
                />
            </div>

            <Modal.Body className="text-center p-5">
                {/* Icon Cánh cửa (Bạn có thể thay bằng ảnh SVG để giống 100%) */}
                <div className="mb-4 d-flex justify-content-center">
                    <div className="position-relative" style={{ width: '100px', height: '100px' }}>
                        {/* Đây là giả lập icon cánh cửa xanh trong ảnh */}
                        <div className="bg-primary bg-opacity-10 rounded-circle w-100 h-100 d-flex align-items-center justify-content-center">
                            <div style={{ fontSize: '50px' }}>🚪</div>
                        </div>
                        {/* Mũi tên hướng ra ngoài */}
                        <div className="position-absolute top-50 start-100 translate-middle text-primary fw-bold" style={{ fontSize: '24px' }}>
                            ➜
                        </div>
                    </div>
                </div>

                <h4 className="fw-bold mb-3">Đăng xuất?</h4>
                <p className="text-secondary small mb-4">
                    Bạn sẽ không nhận được các đặc quyền riêng dành cho thành viên.
                </p>

                <div className="d-flex gap-3">
                    <Button
                        variant="light"
                        className="w-100 py-2 rounded-pill fw-bold text-primary border-0"
                        style={{ backgroundColor: '#e7efff' }}
                        onClick={handleLogout}
                    >
                        Đăng xuất
                    </Button>
                    <Button
                        variant="primary"
                        className="w-100 py-2 rounded-pill fw-bold shadow-sm"
                        style={{ backgroundColor: '#1250dc', border: 'none' }}
                        onClick={handleClose}
                    >
                        Đóng
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default LogoutModal;