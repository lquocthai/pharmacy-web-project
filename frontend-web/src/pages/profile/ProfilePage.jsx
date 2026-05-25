import React, { useEffect, useState } from 'react';
import { Container, Row, Col, ListGroup, Card, Button, Nav, Form } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import LogoutModal from '../../components/Auth/LogoutModal';
import AddressManager from '../../components/Address/AddressManager';
import userService from '../../services/profileService';
import { setUserInfo } from '../../redux/slices/authSlice';
import {
    User, Package, MapPin, Syringe, FileText, Pill, LogOut, ChevronRight
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import MyOrders from './MyOrder';


const ProfilePage = () => {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
    const [showLogout, setShowLogout] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const dispatch = useDispatch();

    // State lưu dữ liệu Form
    const [formData, setFormData] = useState({
        username: '',
        dob: '',
        sex: '',
        phone: ''
    });
    // Load thông tin user khi component mount hoặc khi isAuthenticated thay đổi
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await userService.getMe();

                dispatch(setUserInfo(res.data.result));
            } catch (error) {
                toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin cá nhân!');
            }
        };

        if (isAuthenticated) {
            fetchProfile();
        }
    }, [dispatch, isAuthenticated]);
    // Cập nhật dữ liệu từ redux vào form khi khởi tạo hoặc khi tắt chế độ sửa
    useEffect(() => {
        if (!isEditing && user) {
            setFormData({
                username: user.username || '',
                dob: user.dob || '',
                sex: user.sex || '',
                phone: user.phone || ''
            });
        }
    }, [user, isEditing]);
    // sync activeTab với query param ?tab=... để có thể share link trực tiếp đến tab cụ thể
    useEffect(() => {
        setActiveTab(searchParams.get('tab') || 'profile');
    }, [searchParams]);
    const handleTabChange = (tab) => {
        setSearchParams({ tab });
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsUpdating(true);

        try {
            const payload = {
                username: formData.username,
                dob: formData.dob || null,
                sex: formData.sex || null,
                phone: formData.phone || null
            };
            const res = await userService.updateUser(user.id, payload);

            const updatedUser = res.data.result;

            // update redux
            dispatch(setUserInfo(updatedUser));

            toast.success('Cập nhật thông tin thành công!');

            setIsEditing(false);

        } catch (error) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin!');
        } finally {
            setIsUpdating(false);
        }
    };

    const getHeaderTitle = () => {
        switch (activeTab) {
            case 'address':
                return 'Quản lý sổ địa chỉ';
            case 'orders':
                return 'Đơn hàng của tôi';
            default:
                return 'Thông tin cá nhân';
        }
    };

    return (
        <div className=" min-vh-100 py-4">
            <Container>
                {/* Breadcrumb */}
                <Nav className="small mb-4 text-muted">
                    Trang chủ / Cá nhân / <span className="text-primary ms-1 fw-bold">Thông tin cá nhân</span>
                </Nav>

                <Row>
                    {/* Sidebar */}
                    <Col lg={3} md={4} className="mb-4">
                        {/* User Card */}
                        <Card className="border-0 shadow-sm rounded-4 text-center text-white mb-3"
                            style={{ background: 'linear-gradient(to right, #1250dc, #0d3fad)' }}>
                            <Card.Body className="py-4">
                                <div className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                    style={{ width: '80px', height: '80px', border: '4px solid rgba(255,255,255,0.3)' }}>
                                    <User size={40} className="text-white" />
                                </div>
                                <p className="fw-bold mb-1 text-white">{user?.username || 'Người dùng'}</p>
                                <small className="opacity-75">{user?.phone || ''}</small>
                            </Card.Body>
                        </Card>

                        {/* Menu List - CODE CỨNG TỪNG ITEM */}
                        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                            <ListGroup variant="flush">
                                {/* Thông tin cá nhân */}
                                <ListGroup.Item action onClick={() => handleTabChange('profile')}
                                    className={`d-flex align-items-center justify-content-between py-3 px-4 border-0 ${activeTab === 'profile' ? 'bg-primary-subtle text-primary fw-bold' : ''}`}>
                                    <div className="d-flex align-items-center gap-3">
                                        <User size={18} className={activeTab === 'profile' ? 'text-primary' : 'text-secondary'} />
                                        <span>Thông tin cá nhân</span>
                                    </div>
                                    <ChevronRight size={16} className="text-secondary opacity-50" />
                                </ListGroup.Item>

                                {/* Đơn hàng của tôi */}
                                <ListGroup.Item action onClick={() => handleTabChange('orders')}
                                    className={`d-flex align-items-center justify-content-between py-3 px-4 border-0 ${activeTab === 'orders' ? 'bg-primary-subtle text-primary fw-bold' : ''}`}>
                                    <div className="d-flex align-items-center gap-3">
                                        <Package size={18} className={activeTab === 'orders' ? 'text-primary' : 'text-secondary'} />
                                        <span>Đơn hàng của tôi</span>
                                    </div>
                                    <ChevronRight size={16} className="text-secondary opacity-50" />
                                </ListGroup.Item>

                                {/* Quản lý sổ địa chỉ */}
                                <ListGroup.Item action onClick={() => handleTabChange('address')}
                                    className={`d-flex align-items-center justify-content-between py-3 px-4 border-0 ${activeTab === 'address' ? 'bg-primary-subtle text-primary fw-bold' : ''}`}>
                                    <div className="d-flex align-items-center gap-3">
                                        <MapPin size={18} className={activeTab === 'address' ? 'text-primary' : 'text-secondary'} />
                                        <span>Quản lý sổ địa chỉ</span>
                                    </div>
                                    <ChevronRight size={16} className="text-secondary opacity-50" />
                                </ListGroup.Item>

                                {/* Lịch hẹn tiêm chủng */}
                                <ListGroup.Item action onClick={() => handleTabChange('vaccine-schedule')}
                                    className={`d-flex align-items-center justify-content-between py-3 px-4 border-0 ${activeTab === 'vaccine-schedule' ? 'bg-primary-subtle text-primary fw-bold' : ''}`}>
                                    <div className="d-flex align-items-center gap-3">
                                        <Syringe size={18} className={activeTab === 'vaccine-schedule' ? 'text-primary' : 'text-secondary'} />
                                        <span>Lịch hẹn tiêm chủng</span>
                                    </div>
                                    <ChevronRight size={16} className="text-secondary opacity-50" />
                                </ListGroup.Item>

                                {/* Đơn hàng tiêm chủng */}
                                <ListGroup.Item action onClick={() => handleTabChange('vaccine-orders')}
                                    className={`d-flex align-items-center justify-content-between py-3 px-4 border-0 ${activeTab === 'vaccine-orders' ? 'bg-primary-subtle text-primary fw-bold' : ''}`}>
                                    <div className="d-flex align-items-center gap-3">
                                        <FileText size={18} className={activeTab === 'vaccine-orders' ? 'text-primary' : 'text-secondary'} />
                                        <span>Đơn hàng tiêm chủng</span>
                                    </div>
                                    <ChevronRight size={16} className="text-secondary opacity-50" />
                                </ListGroup.Item>

                                {/* Đơn thuốc của tôi */}
                                <ListGroup.Item action onClick={() => handleTabChange('prescriptions')}
                                    className={`d-flex align-items-center justify-content-between py-3 px-4 border-0 ${activeTab === 'prescriptions' ? 'bg-primary-subtle text-primary fw-bold' : ''}`}>
                                    <div className="d-flex align-items-center gap-3">
                                        <Pill size={18} className={activeTab === 'prescriptions' ? 'text-primary' : 'text-secondary'} />
                                        <span>Đơn thuốc của tôi</span>
                                    </div>
                                    <ChevronRight size={16} className="text-secondary opacity-50" />
                                </ListGroup.Item>

                                {/* Đăng xuất - Nhấn vào hiện Modal */}
                                <ListGroup.Item action onClick={() => setShowLogout(true)}
                                    className="d-flex align-items-center justify-content-between py-3 px-4 border-0 text-dark">
                                    <div className="d-flex align-items-center gap-3">
                                        <LogOut size={18} className="text-secondary" />
                                        <span>Đăng xuất</span>
                                    </div>
                                    <ChevronRight size={16} className="text-secondary opacity-50" />
                                </ListGroup.Item>
                            </ListGroup>
                        </Card>
                    </Col>

                    {/* Content Area - PHẦN THAY ĐỔI THEO ACTIVE TAB */}
                    <Col lg={9} md={8}>
                        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                            <Card.Header
                                className="bg-white px-4 border-bottom d-flex justify-content-between align-items-center"
                                style={{ borderColor: '#dee2e6', minHeight: '60px' }}
                            >
                                <p className="mb-0 fw-bold text-dark">
                                    {getHeaderTitle()}
                                </p>
                                {activeTab === 'profile' && (
                                    <div style={{ width: '70px' }} className="text-end">
                                        {isEditing && (
                                            <Button variant="outline-secondary" size="sm"
                                                onClick={() => setIsEditing(false)}>
                                                Hủy
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </Card.Header>

                            <Card.Body className="">
                                {/* ── Tab: Quản lý sổ địa chỉ ── */}
                                {activeTab === 'address' && <AddressManager />}

                                {/* ── Tab: Đơn hàng của tôi ── */}
                                {activeTab === 'orders' && <MyOrders />}

                                {/* ── Tab: Thông tin cá nhân ── */}
                                {activeTab === 'profile' && (
                                    <>
                                        {/* Avatar Section */}
                                        <div className="text-center mb-4">
                                            <div className="position-relative d-inline-block">
                                                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                                                    style={{ width: '100px', height: '100px' }}>
                                                    <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center"
                                                        style={{ width: '80px', height: '80px' }}>
                                                        <User size={45} className="text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mx-auto fs-6" style={{ maxWidth: '500px' }}>
                                            {!isEditing ? (
                                                /* CHẾ ĐỘ VIEW */
                                                <>
                                                    <div className="d-flex justify-content-between align-items-center py-1 border-bottom border-light-subtle">
                                                        <span className="text-secondary fs-6">Họ và tên</span>
                                                        <span className="fw-bold text-dark">{formData.username}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-center py-1 border-bottom border-light-subtle ">
                                                        <span className="text-secondary fs-6">Email</span>
                                                        <span className="fw-bold text-dark">{user.email}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-center py-1 border-bottom border-light-subtle ">
                                                        <span className="text-secondary fs-6">Số điện thoại</span>
                                                        <span className="fw-bold text-dark">
                                                            <span className={formData.phone ? "fw-bold text-dark" : "text-primary fw-medium"}>
                                                                {formData.phone || "Chưa cập nhật"}
                                                            </span>
                                                        </span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-center py-1 border-bottom border-light-subtle ">
                                                        <span className="text-secondary fs-6">Giới tính</span>
                                                        <span className={formData.sex ? "fw-bold text-dark" : "text-primary fw-medium"}>
                                                            {formData.sex || "Chưa cập nhật"}
                                                        </span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-center py-1 border-bottom border-light-subtle ">
                                                        <span className="text-secondary fs-6">Ngày sinh</span>
                                                        <span className={formData.dob ? "fw-bold text-dark" : "text-primary fw-medium"}>
                                                            {formData.dob || "Chưa cập nhật"}
                                                        </span>
                                                    </div>

                                                    <div className="text-center">
                                                        <Button variant="primary" className="mt-5 px-5 py-2 rounded-pill fw-bold shadow-sm"
                                                            onClick={() => setIsEditing(true)}
                                                            style={{ backgroundColor: '#1250dc', border: 'none' }}>
                                                            Chỉnh sửa thông tin
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                /* CHẾ ĐỘ EDIT (FORM) */
                                                <Form>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label className="text-start text-secondary small fw-bold">Họ và tên</Form.Label>
                                                        <Form.Control
                                                            name="username"
                                                            value={formData.username}
                                                            onChange={handleInputChange}
                                                            className="py-2 px-3 rounded-3"
                                                        />
                                                    </Form.Group>

                                                    <Form.Group className="mb-3">
                                                        <Form.Label className="text-start text-secondary small fw-bold">Số điện thoại</Form.Label>
                                                        <Form.Control
                                                            name="phone"
                                                            value={formData.phone}
                                                            onChange={handleInputChange}
                                                            // disabled // Số điện thoại thường không cho sửa hoặc sửa qua OTP
                                                            className="bg-light py-2 px-3 rounded-3"
                                                        />
                                                    </Form.Group>

                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label className="text-start text-secondary small fw-bold">Giới tính</Form.Label>
                                                                <Form.Select
                                                                    name="sex"
                                                                    value={formData.sex}
                                                                    onChange={handleInputChange}
                                                                    className="py-2 px-3 rounded-3"
                                                                >
                                                                    <option value="">Chọn giới tính</option>
                                                                    <option value="Nam">Nam</option>
                                                                    <option value="Nữ">Nữ</option>                                                        </Form.Select>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label className="text-start text-secondary small fw-bold">Ngày sinh</Form.Label>
                                                                <Form.Control
                                                                    type="date"
                                                                    name="dob"
                                                                    value={formData.dob}
                                                                    onChange={handleInputChange}
                                                                    className="py-2 px-3 rounded-3"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <div className="text-center">
                                                        <Button variant="primary" className="mt-4 px-5 py-2 rounded-pill fw-bold shadow-sm w-100 w-md-auto"
                                                            onClick={handleUpdate}
                                                            style={{ backgroundColor: '#1250dc', border: 'none' }}>
                                                            {isUpdating ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
                                                        </Button>
                                                    </div>
                                                </Form>
                                            )}
                                        </div>
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
            <LogoutModal
                show={showLogout}
                handleClose={() => setShowLogout(false)}
            />


            <style>{`
                    .bg-primary-subtle { background-color: #e7efff !important; }
                    .text-primary { color: #1250dc !important; }
                    .list-group-item-action:hover { background-color: #f8f9fa; }
                `}</style>
        </div>
    );
};

export default ProfilePage;