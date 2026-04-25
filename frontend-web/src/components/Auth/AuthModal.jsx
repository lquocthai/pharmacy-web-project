import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { closeLoginModal, setLoginSuccess } from '../../redux/slices/authSlice';
import { GoogleLogin } from '@react-oauth/google';
import authService from '../../services/authService';
import './AuthModal.scss';

const AuthModal = () => {
    const dispatch = useDispatch();
    const { isLoginModalOpen } = useSelector((state) => state.auth);
    const [mode, setMode] = useState('LOGIN'); // LOGIN, REGISTER, OTP
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");

    const [loginLoading, setLoginLoading] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [otpTimer, setOtpTimer] = useState(300);
    const [resendTimer, setResendTimer] = useState(0);

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);

    // 1. Gửi yêu cầu quên mật khẩu (Lấy OTP)
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotLoading(true);
        try {
            await authService.forgotPassword(email);
            alert("Mã xác thực đã được gửi!");
            setMode('OTP'); // Chuyển sang nhập OTP
        } catch (error) {
            alert(error.response?.data?.message || "Email không tồn tại");
        } finally { setForgotLoading(false); }
    };

    // const handleVerifyOtp = async () => {
    //     setLoading(true);
    //     try {
    //         const res = await authService.verifyOtp({ email, otp: otp.join("") });
    //         if (res.data.code === 0) {
    //             // Nếu không có username nghĩa là đang ở luồng Quên mật khẩu
    //             if (!username) setMode('RESET_PASSWORD');
    //             else {
    //                 alert("Đăng ký thành công!");
    //                 setMode('LOGIN');
    //             }
    //         }
    //     } catch (error) {
    //         alert("Mã OTP không đúng hoặc hết hạn");
    //     } finally { setLoading(false); }
    // };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) return alert("Mật khẩu không khớp!");
        setResetLoading(true);
        try {
            await authService.resetPassword({
                email: email,
                newPassword: newPassword
            });
            alert("Đổi mật khẩu thành công!");
            setMode('LOGIN');
        } catch (error) {
            alert("Lỗi khi đặt lại mật khẩu");
        } finally { setResetLoading(false); }
    };


    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        try {
            const res = await authService.login({
                email: email,
                password: password
            });

            // Giả sử backend trả về: { result: { token: '...', refreshToken: '...', user: {...} } }
            const { code, result, message } = res.data;
            console.log(result);
            if (code === 0) {
                // TRƯỜNG HỢP THÀNH CÔNG
                console.log("Login Success:", result);
                dispatch(setLoginSuccess(result));
                dispatch(closeLoginModal());
            } else {
                alert(`Lỗi (${code}): ${message || "Đăng nhập không thành công"}`);
            }

        } catch (error) {
            console.error("Login Error:", error);
            const errorMsg = error.response?.data?.message || "Lỗi kết nối đến máy chủ";
            alert("Đăng nhập thất bại: " + errorMsg);
        } finally {
            setLoginLoading(false);
        }
    };
    const handleRegister = async (e) => {
        e.preventDefault();
        setRegisterLoading(true);
        try {
            const res = await authService.register({
                username: username,
                email: email,
                password: password
            });


            const { code, result, message } = res.data;

            if (code === 0) {
                console.log("Register Success:", result);
                setMode('OTP');
            } else {
                alert(`Lỗi (${code}): ${message || "Đăng ký không thành công"}`);
            }
        } catch (error) {
            console.error("Register Error:", error);
            const errorMsg = error.response?.data?.message || "Lỗi kết nối đến máy chủ";
            alert("Đăng ký thất bại: " + errorMsg);
        } finally {
            setRegisterLoading(false);
        }
    };
    const handleOtpChange = (value, index) => {
        if (!/^[0-9]?$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };
    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace") {
            if (otp[index] === "" && index > 0) {
                document.getElementById(`otp-${index - 1}`).focus();
            } else {
                const newOtp = [...otp];
                newOtp[index] = "";
                setOtp(newOtp);
            }
        }
    };

    // Effect quản lý đếm ngược
    useEffect(() => {
        let interval = null;
        if (mode === 'OTP') {
            interval = setInterval(() => {
                setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
                setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [mode]);

    // Hàm định dạng thời gian (ví dụ: 02:30)
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Xử lý xác thực OTP
    const handleVerifyOtp = async () => {
        const otpCode = otp.join("");
        if (otpCode.length < 6) {
            alert("Vui lòng nhập đủ 6 số");
            return;
        }

        setIsVerifying(true);
        try {
            const res = await authService.verifyOtp({ email, otp: otpCode });
            if (res.data.code === 0) {
                alert("Xác thực thành công! Vui lòng đăng nhập.");
                setMode('LOGIN');
            } else {
                alert(res.data.message);
            }
        } catch (error) {
            alert(error.response?.data?.message || "Xác thực thất bại");
        } finally {
            setIsVerifying(false);
        }
    };

    // Xử lý gửi lại mã
    const handleResendOtp = async () => {
        if (resendTimer > 0) return;

        try {
            const res = await authService.resendOtp({ email });
            if (res.data.code === 0) {
                alert(res.data.result);
                setResendTimer(60); // Reset cooldown 60s
                setOtpTimer(300);   // Reset thời gian hiệu lực 5p
                setOtp(["", "", "", "", "", ""]); // Xóa OTP cũ
            }
        } catch (error) {
            const msg = error.response?.data?.message || "Không thể gửi lại mã";
            alert(msg);
        }
    };

    const handleGoogleSuccess = async (response) => {
        try {
            const res = await authService.loginGoogle(response.credential);
            dispatch(setLoginSuccess(res.data.result));
            dispatch(closeLoginModal());
        } catch (error) {
            console.error("Google Login Error", error);
        }
    };
    if (!isLoginModalOpen) return null;

    return (
        <div className="auth-modal-backdrop d-flex align-items-center justify-content-center" >
            <div className="modal-dialog custom-modal-size" onClick={e => e.stopPropagation()}>
                <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
                    {/* Header có nút Close xịn của Bootstrap */}
                    <div className="modal-header border-0 pb-0">
                        <button type="button" className="btn-close shadow-none"
                            onClick={() => {
                                dispatch(closeLoginModal()),
                                    setMode('LOGIN')
                            }}>

                        </button>
                    </div>

                    <div className="modal-body px-4 px-md-5 pb-5 pt-0">
                        {mode === 'FORGOT_PASSWORD' && (
                            <form onSubmit={handleForgotPassword} className="animate-fade-in">
                                <h2 className="text-center fw-bold mb-4 text-primary">Quên Mật Khẩu</h2>
                                <input type="email" className="form-control mb-3" placeholder="Nhập Email của bạn"
                                    required onChange={e => setEmail(e.target.value)} />
                                <button className="btn btn-primary w-100 fw-bold" disabled={forgotLoading}>
                                    {forgotLoading ? 'ĐANG GỬI...' : 'GỬI MÃ XÁC THỰC'}
                                </button>
                                <p className="text-center mt-3 small">
                                    <span className="text-primary cursor-pointer" onClick={() => {
                                        setMode('LOGIN')
                                        setEmail("");
                                    }}>Quay lại đăng nhập</span>
                                </p>
                            </form>
                        )}
                        {mode === 'LOGIN' && (
                            <form className="auth-form animate-fade-in" onSubmit={handleLogin}>
                                <h2 className="text-center fw-bold mb-4 text-primary">Đăng Nhập</h2>
                                <div className="mb-3">
                                    <input
                                        type="email"
                                        className="form-control shadow-none py-2"
                                        placeholder="Email"
                                        autoComplete="username"
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="mb-2">

                                    <input
                                        type="password"
                                        className="form-control shadow-none py-2"
                                        placeholder="Mật khẩu"
                                        autoComplete="current-password"
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 py-2 fw-bold mb-3 shadow-sm"
                                    disabled={loginLoading}
                                >
                                    {loginLoading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
                                </button>
                                <div className="text-end mb-3">
                                    <span className="text-primary small cursor-pointer" onClick={() => setMode('FORGOT_PASSWORD')}>Quên mật khẩu?</span>
                                </div>


                                <p className="text-center small text-muted">
                                    Chưa có tài khoản? <span className="text-primary fw-bold cursor-pointer" onClick={() => setMode('REGISTER')}>Đăng ký ngay</span>
                                </p>

                                <div className="divider-container my-4">
                                    <span className="divider-text text-muted small px-2">Hoặc đăng nhập với</span>
                                </div>

                                <div className="d-flex justify-content-center">
                                    <GoogleLogin onSuccess={handleGoogleSuccess} />
                                </div>
                            </form>
                        )}
                        {mode === 'RESET_PASSWORD' && (
                            <form onSubmit={handleResetPassword} className="animate-fade-in">
                                <h2 className="text-center fw-bold mb-4 text-primary">Mật Khẩu Mới</h2>
                                <input type="password" className="form-control mb-3" placeholder="Mật khẩu mới"
                                    required onChange={e => setNewPassword(e.target.value)} />
                                <input type="password" className="form-control mb-3" placeholder="Xác nhận mật khẩu"
                                    required onChange={e => setConfirmPassword(e.target.value)} />
                                <button className="btn btn-primary w-100 fw-bold" disabled={resetLoading}>
                                    {resetLoading ? 'ĐANG XỬ LÝ...' : 'ĐẶT LẠI MẬT KHẨU'}
                                </button>
                            </form>
                        )}

                        {mode === 'REGISTER' && (
                            <form className="auth-form animate-fade-in" onSubmit={handleRegister}>
                                <h2 className="text-center fw-bold mb-4 text-primary">Đăng Ký Tài Khoản</h2>

                                <div className="mb-3">
                                    <input
                                        type="text"
                                        className="form-control shadow-none py-2"
                                        placeholder="Tên người dùng"
                                        required
                                        // value={username}
                                        onChange={e => setUsername(e.target.value)}
                                    />
                                </div>

                                <div className="mb-3">
                                    <input
                                        type="email"
                                        className="form-control shadow-none py-2"
                                        placeholder="Email"
                                        required
                                        // value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>

                                <div className="mb-3">
                                    <input
                                        type="password"
                                        className="form-control shadow-none py-2"
                                        placeholder="Mật khẩu"
                                        required
                                        // value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 py-2 fw-bold mb-3 shadow-sm"
                                    disabled={registerLoading}
                                >
                                    {registerLoading ? 'ĐANG XỬ LÝ...' : 'TIẾP TỤC'}
                                </button>

                                <p className="text-center small text-muted">
                                    Đã có tài khoản? <span className="text-primary fw-bold cursor-pointer" onClick={() => setMode('LOGIN')}>Đăng nhập</span>
                                </p>
                            </form>
                        )}

                        {mode === 'OTP' && (
                            <div className="auth-form text-center animate-fade-in">
                                <h2 className="fw-bold mb-3 text-primary">Xác thực OTP</h2>

                                <p className="text-muted small mb-2">
                                    Mã xác thực đã được gửi đến email <b>{email}</b>
                                </p>

                                {/* Bộ đếm hiệu lực OTP */}
                                <div className="mb-4">
                                    <span className={`badge ${otpTimer > 0 ? 'bg-light text-dark' : 'bg-danger'}`}>
                                        Mã hết hiệu lực sau: {formatTime(otpTimer)}
                                    </span>
                                </div>

                                <div className="d-flex justify-content-center gap-2 mb-4">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`otp-${index}`}
                                            type="text"
                                            className="otp-input"
                                            maxLength="1"
                                            value={digit}
                                            onChange={(e) => handleOtpChange(e.target.value, index)}
                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                            disabled={otpTimer === 0 || isVerifying}
                                        />
                                    ))}
                                </div>

                                <button
                                    className="btn btn-primary w-100 py-2 fw-bold mb-3"
                                    onClick={handleVerifyOtp}
                                    disabled={otpTimer === 0 || isVerifying}
                                >
                                    {isVerifying ? 'ĐANG KIỂM TRA...' : 'XÁC NHẬN'}
                                </button>

                                <p className="text-muted small">
                                    Không nhận được mã?{' '}
                                    {resendTimer > 0 ? (
                                        <span className="text-secondary fw-bold">
                                            Gửi lại sau ({resendTimer}s)
                                        </span>
                                    ) : (
                                        <span
                                            className="text-primary fw-bold cursor-pointer"
                                            onClick={handleResendOtp}
                                        >
                                            Gửi lại mã
                                        </span>
                                    )}
                                </p>

                                <div className="mt-3">
                                    <span
                                        className="text-muted small cursor-pointer text-decoration-underline"
                                        onClick={() => setMode('REGISTER')}
                                    >
                                        Quay lại đăng ký
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;