import { useState } from 'react';
import toast from 'react-hot-toast';

/**
 * NewsletterBanner — "Nhận Ưu Đãi & Tin Tức Sức Khỏe"
 * Form đăng ký newsletter — client-side only (có thể nối API sau).
 */
export default function NewsletterBanner() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error('Email không hợp lệ');
            return;
        }

        setLoading(true);
        // TODO: nối API đăng ký newsletter
        await new Promise((r) => setTimeout(r, 800));
        setLoading(false);
        toast.success('Đăng ký thành công! Kiểm tra email của bạn.');
        setEmail('');
    };

    return (
        <section
            className="py-5"
            style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #004AC6 100%)',
            }}
        >
            <div className="container-xl">
                <div className="text-center mb-4">
                    <h2
                        className="fw-bold text-white mb-2"
                        style={{
                            fontFamily: 'Manrope, system-ui, sans-serif',
                            fontSize: 'clamp(20px, 3vw, 28px)',
                        }}
                    >
                        Nhận Ưu Đãi & Tin Tức Sức Khỏe
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>
                        Đăng ký bản tin để không bỏ lỡ những chương trình khuyến mãi độc quyền dành riêng cho bạn.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="d-flex flex-column flex-sm-row gap-2 justify-content-center"
                    style={{ maxWidth: 520, margin: '0 auto' }}
                >
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập email của bạn..."
                        className="form-control rounded-pill px-4 border-0 shadow-none"
                        style={{ flex: 1, fontSize: 15, height: 48 }}
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn rounded-pill px-5 fw-bold text-primary flex-shrink-0"
                        style={{
                            background: '#fff',
                            height: 48,
                            fontSize: 15,
                            minWidth: 140,
                        }}
                    >
                        {loading ? (
                            <span className="spinner-border spinner-border-sm" role="status" />
                        ) : (
                            'Đăng Ký Ngay'
                        )}
                    </button>
                </form>

                <p
                    className="text-center mt-3"
                    style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                >
                    Chúng tôi cam kết bảo mật thông tin và không gửi spam.
                </p>
            </div>
        </section>
    );
}
