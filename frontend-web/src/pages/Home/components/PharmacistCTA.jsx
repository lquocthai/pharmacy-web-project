import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { openChat } from '../../../redux/slices/chatSlice';
// Giả sử bạn có action openLoginModal trong authSlice hoặc modalSlice để bật modal đăng nhập
import { openLoginModal } from '../../../redux/slices/authSlice';

/**
 * PharmacistCTA — "Bạn cần tư vấn chuyên môn?"
 * Banner nhắc người dùng chat với dược sĩ.
 */
export default function PharmacistCTA() {
    const dispatch = useDispatch();

    // 1. Lấy trạng thái đăng nhập từ redux (bạn hãy đổi tên state cho đúng với dự án của bạn nhé)
    const { isAuthenticated } = useSelector((state) => state.auth);
    const isChatOpen = useSelector((state) => state.chat.isChatOpen);

    // 2. Xử lý logic khi bấm nút
    const handleContactConsultant = () => {
        if (!isAuthenticated) {
            // Nếu chưa đăng nhập -> Kích hoạt modal đăng nhập
            dispatch(openLoginModal());
            // Hoặc nếu dự án của bạn dùng chuyển trang: navigate('/login');
            return;
        }

        // Nếu đã đăng nhập thành công -> Cho phép mở chat
        dispatch(openChat());
    };

    return (
        <div className="container-xl py-3 ">
            <section className="py-5 rounded-4" >
                <div className="container-xl p-0">
                    <div
                        className="rounded-4 px-4 px-md-5 py-4 d-flex flex-column flex-md-row align-items-center justify-content-between gap-4"
                        style={{
                            background: 'linear-gradient(90deg, #EFF4FF 0%, #F0FDF4 100%)',
                            border: '1px solid #C3D5FF',
                        }}
                    >
                        {/* Avatar + text */}
                        <div className="d-flex align-items-center gap-4">
                            <div
                                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                style={{
                                    width: 64,
                                    height: 64,
                                    background: '#2563EB',
                                }}
                            >
                                <span className="material-icons text-white" style={{ fontSize: 32 }}>
                                    support_agent
                                </span>
                            </div>
                            <div className="text-start">
                                <h3
                                    className="fw-bold mb-1"
                                    style={{
                                        fontFamily: 'Manrope, system-ui, sans-serif',
                                        fontSize: 20,
                                        color: '#191c1e',
                                    }}
                                >
                                    Bạn cần tư vấn chuyên môn?
                                </h3>
                                <p style={{ fontSize: 14, color: '#434655', margin: 0 }}>
                                    Dược sĩ của chúng tôi luôn sẵn sàng hỗ trợ bạn hoàn toàn miễn phí.
                                </p>
                            </div>
                        </div>

                        {/* CTA button */}
                        <button
                            onClick={handleContactConsultant}
                            className="btn rounded-pill px-5 py-2 fw-bold text-white flex-shrink-0"
                            style={{
                                background: '#2563EB',
                                fontSize: 15,
                                boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
                            }}
                        >
                            <span className="material-icons align-middle me-2" style={{ fontSize: 18, verticalAlign: 'middle' }}>
                                forum
                            </span>
                            Chat với dược sĩ
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}